package com.kavach.subscription.service;

import com.kavach.devices.repository.DeviceRepository;
import com.kavach.subscription.dto.*;
import com.kavach.subscription.entity.*;
import com.kavach.subscription.repository.*;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subRepo;
    private final PlanRepository planRepo;
    private final PaymentOrderRepository paymentOrderRepo;
    private final DeviceRepository deviceRepo;
    private final RazorpayClient razorpayClient;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    // ── Get current subscription ──────────────────────────────────────────────
    @Transactional
    public SubscriptionDto getCurrentSubscription(UUID tenantId) {
        Subscription sub = subRepo.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("No subscription found for tenant"));
        Plan plan = planRepo.findById(sub.getPlanId())
            .orElseThrow(() -> new RuntimeException("Plan not found"));

        // Sync real device count on every read
        int activeDevices = (int) deviceRepo.findByTenantIdAndActiveTrue(tenantId).size();
        sub.setDeviceCount(activeDevices);
        sub.setUpdatedAt(LocalDateTime.now());
        subRepo.save(sub);

        return toDto(sub, plan);
    }

    // ── List plans — filtered by tenant type ─────────────────────────────────
    // Pass planType = "B2C" for parents, "B2B" for institutes
    public List<PlanDto> getPlansForType(UUID tenantId, String planType) {
        Subscription current = subRepo.findByTenantId(tenantId).orElse(null);
        String currentCode = current != null
            ? planRepo.findById(current.getPlanId()).map(Plan::getCode).orElse("") : "";

        return planRepo.findByPlanTypeAndActiveTrueOrderByPriceFlatAsc(planType).stream()
            .map(p -> toPlanDto(p, p.getCode().equals(currentCode)))
            .toList();
    }

    // ── STEP 1: Create Razorpay order ─────────────────────────────────────────
    // Frontend calls this first. Returns orderId + keyId for Razorpay SDK checkout.
    @Transactional
    public CreateOrderResponse createOrder(UUID tenantId, String planCode) {
        Plan plan = planRepo.findByCode(planCode.toUpperCase())
            .orElseThrow(() -> new RuntimeException("Plan not found: " + planCode));

        subRepo.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("No subscription record found"));

        // Flat price — no per-device multiplication
        int amount = plan.getPriceFlat();

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "kavach_" + tenantId.toString().substring(0, 8));
            orderRequest.put("notes", new JSONObject()
                .put("tenantId", tenantId.toString())
                .put("planCode", plan.getCode())
            );

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String rzpOrderId = razorpayOrder.get("id");

            // Persist pending order record
            paymentOrderRepo.save(PaymentOrder.builder()
                .tenantId(tenantId)
                .planId(plan.getId())
                .razorpayOrderId(rzpOrderId)
                .amount(amount)
                .currency("INR")
                .status("CREATED")
                .build());

            log.info("[payment] Order created: {} tenant={} plan={} amount={}",
                rzpOrderId, tenantId, planCode, amount);

            return CreateOrderResponse.builder()
                .orderId(rzpOrderId)
                .amount(amount)
                .currency("INR")
                .keyId(razorpayKeyId)
                .planName(plan.getName())
                .planCode(plan.getCode())
                .description("Kavach AI — " + plan.getName() + " Plan (" + formatRupees(amount) + "/month)")
                .build();

        } catch (RazorpayException e) {
            log.error("[payment] Razorpay order creation failed: {}", e.getMessage());
            throw new RuntimeException("Payment initiation failed. Please try again.");
        }
    }

    // ── STEP 2: Verify payment + activate plan ────────────────────────────────
    // Called after Razorpay checkout succeeds in the browser.
    // Verifies HMAC signature — never trust the frontend alone.
    @Transactional
    public SubscriptionDto verifyAndActivate(UUID tenantId, VerifyPaymentRequest req) {
        // 1. Verify Razorpay signature
        try {
            boolean valid = Utils.verifyPaymentSignature(
                new JSONObject()
                    .put("razorpay_order_id", req.getRazorpayOrderId())
                    .put("razorpay_payment_id", req.getRazorpayPaymentId())
                    .put("razorpay_signature", req.getRazorpaySignature()),
                razorpayKeySecret
            );
            if (!valid) {
                throw new RuntimeException("Payment signature verification failed");
            }
        } catch (RazorpayException e) {
            throw new RuntimeException("Signature verification error: " + e.getMessage());
        }

        // 2. Mark payment order as PAID
        PaymentOrder order = paymentOrderRepo.findByRazorpayOrderId(req.getRazorpayOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + req.getRazorpayOrderId()));

        order.setRazorpayPaymentId(req.getRazorpayPaymentId());
        order.setRazorpaySignature(req.getRazorpaySignature());
        order.setStatus("PAID");
        order.setUpdatedAt(LocalDateTime.now());
        paymentOrderRepo.save(order);

        // 3. Activate subscription
        Plan plan = planRepo.findByCode(req.getPlanCode().toUpperCase())
            .orElseThrow(() -> new RuntimeException("Plan not found"));

        Subscription sub = subRepo.findByTenantId(tenantId)
            .orElseThrow(() -> new RuntimeException("No subscription found"));

        sub.setPlanId(plan.getId());
        sub.setStatus("ACTIVE");
        sub.setTrialEndsAt(null);
        sub.setCurrentPeriodStart(LocalDateTime.now());
        sub.setCurrentPeriodEnd(LocalDateTime.now().plusDays(30));
        sub.setUpdatedAt(LocalDateTime.now());
        subRepo.save(sub);

        log.info("[payment] VERIFIED + ACTIVATED: tenant={} plan={} paymentId={}",
            tenantId, req.getPlanCode(), req.getRazorpayPaymentId());

        return toDto(sub, plan);
    }

    // ── Webhook handler (idempotent) ──────────────────────────────────────────
    // Razorpay calls this server-side on payment.captured event.
    // Acts as a safety net if the browser verify call fails.
    @Transactional
    public void handleWebhook(String payload, String razorpaySignature) {
        // Verify webhook signature
        try {
            boolean valid = Utils.verifyWebhookSignature(payload, razorpaySignature, webhookSecret);
            if (!valid) {
                log.warn("[webhook] Invalid signature — rejected");
                return;
            }
        } catch (RazorpayException e) {
            log.error("[webhook] Signature check error: {}", e.getMessage());
            return;
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.optString("event");
        log.info("[webhook] Received event: {}", eventType);

        if (!"payment.captured".equals(eventType)) return;

        JSONObject paymentEntity = event
            .getJSONObject("payload")
            .getJSONObject("payment")
            .getJSONObject("entity");

        String rzpOrderId = paymentEntity.optString("order_id");
        String rzpPaymentId = paymentEntity.optString("id");

        paymentOrderRepo.findByRazorpayOrderId(rzpOrderId).ifPresent(order -> {
            // Idempotency: skip if already processed
            if ("PAID".equals(order.getStatus())) {
                log.info("[webhook] Already processed order: {}", rzpOrderId);
                return;
            }

            order.setRazorpayPaymentId(rzpPaymentId);
            order.setStatus("PAID");
            order.setUpdatedAt(LocalDateTime.now());
            paymentOrderRepo.save(order);

            // Activate subscription
            planRepo.findById(order.getPlanId()).ifPresent(plan -> {
                subRepo.findByTenantId(order.getTenantId()).ifPresent(sub -> {
                    sub.setPlanId(plan.getId());
                    sub.setStatus("ACTIVE");
                    sub.setTrialEndsAt(null);
                    sub.setCurrentPeriodStart(LocalDateTime.now());
                    sub.setCurrentPeriodEnd(LocalDateTime.now().plusDays(30));
                    sub.setUpdatedAt(LocalDateTime.now());
                    subRepo.save(sub);
                    log.info("[webhook] Subscription activated: tenant={} plan={}",
                        order.getTenantId(), plan.getCode());
                });
            });
        });
    }

    // ── Scheduled job: Expire subscriptions whose period has ended ───────────
    @Scheduled(fixedDelay = 3600000) // every hour
    @Transactional
    public void expireElapsedSubscriptions() {
        List<Subscription> expired = subRepo.findByStatusIn(Arrays.asList("ACTIVE", "TRIAL"))
                .stream()
                .filter(s -> s.getCurrentPeriodEnd() != null &&
                        s.getCurrentPeriodEnd().isBefore(LocalDateTime.now()))
                .toList();

        for (Subscription sub : expired) {
            sub.setStatus("EXPIRED");
            sub.setUpdatedAt(LocalDateTime.now());
            subRepo.save(sub);
            log.info("[subscription] Expired subscription for tenant {}", sub.getTenantId());
        }
        
        if (!expired.isEmpty()) {
            log.info("[subscription] Expired {} subscriptions", expired.size());
        }
    }

    // ── Device limit check ────────────────────────────────────────────────────
    public boolean canAddDevice(UUID tenantId) {
        return subRepo.findByTenantId(tenantId).map(sub -> {
            // Don't allow adding devices to expired or cancelled subscriptions
            if ("EXPIRED".equals(sub.getStatus()) || "CANCELLED".equals(sub.getStatus())) {
                return false;
            }
            Plan plan = planRepo.findById(sub.getPlanId()).orElse(null);
            if (plan == null) return false;
            if (plan.getMaxDevices() == -1) return true;
            return sub.getDeviceCount() < plan.getMaxDevices();
        }).orElse(true);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    private SubscriptionDto toDto(Subscription sub, Plan plan) {
        int maxDevices = plan.getMaxDevices();
        boolean unlimited = maxDevices == -1;
        double usagePct = unlimited ? 0 :
            (maxDevices > 0 ? (sub.getDeviceCount() * 100.0 / maxDevices) : 0);
        int daysLeft = sub.getCurrentPeriodEnd() != null
            ? (int) ChronoUnit.DAYS.between(LocalDateTime.now(), sub.getCurrentPeriodEnd()) : 0;
        boolean isTrial = "TRIAL".equals(sub.getStatus());

        return SubscriptionDto.builder()
            .planCode(plan.getCode())
            .planName(plan.getName())
            .planType(plan.getPlanType())
            .status(sub.getStatus())
            .isTrial(isTrial)
            .trialEndsAt(sub.getTrialEndsAt())
            .periodEnd(sub.getCurrentPeriodEnd())
            .deviceCount(sub.getDeviceCount())
            .maxDevices(maxDevices)
            .maxDevicesLabel(unlimited ? "Unlimited" : maxDevices + " devices")
            .deviceUsagePercent(Math.round(usagePct * 10.0) / 10.0)
            .daysRemaining(Math.max(daysLeft, 0))
            .nearLimit(!unlimited && usagePct >= 80)
            .atLimit(!unlimited && sub.getDeviceCount() >= maxDevices)
            .features(plan.getFeatures() != null ? Arrays.asList(plan.getFeatures()) : List.of())
            .monthlyTotal(plan.getPriceFlat())
            .monthlyTotalFormatted(formatRupees(plan.getPriceFlat()) + "/month")
            .build();
    }

    private PlanDto toPlanDto(Plan p, boolean current) {
        return PlanDto.builder()
            .id(p.getId())
            .code(p.getCode())
            .name(p.getName())
            .planType(p.getPlanType())
            .priceFlat(p.getPriceFlat())
            .priceFormatted(formatRupees(p.getPriceFlat()) + "/month")
            .maxDevices(p.getMaxDevices())
            .maxDevicesLabel(p.getMaxDevices() == -1 ? "Unlimited"
                : (p.getPlanType().equals("B2B") ? "Up to " : "") + p.getMaxDevices() + " devices")
            .features(p.getFeatures() != null ? Arrays.asList(p.getFeatures()) : List.of())
            .current(current)
            .build();
    }

    private String formatRupees(int paise) {
        return "₹" + (paise / 100);
    }
}
