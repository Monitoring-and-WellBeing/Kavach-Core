package com.kavach.subscription;

import com.kavach.users.UserRepository;
import com.kavach.subscription.dto.*;
import com.kavach.subscription.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscription")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository userRepo;

    // GET /api/v1/subscription/current
    @GetMapping("/current")
    public ResponseEntity<SubscriptionDto> getCurrent(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(subscriptionService.getCurrentSubscription(getTenantId(email)));
    }

    // GET /api/v1/subscription/plans?type=B2C  (or B2B for institute admins)
    @GetMapping("/plans")
    public ResponseEntity<List<PlanDto>> getPlans(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "B2C") String type) {
        return ResponseEntity.ok(subscriptionService.getPlansForType(getTenantId(email), type.toUpperCase()));
    }

    // POST /api/v1/subscription/create-order
    // Body: { "planCode": "STANDARD" }
    // Returns: orderId + keyId for Razorpay SDK
    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(
            @AuthenticationPrincipal String email,
            @RequestBody CreateOrderRequest req) {
        return ResponseEntity.ok(
            subscriptionService.createOrder(getTenantId(email), req.getPlanCode())
        );
    }

    // POST /api/v1/subscription/verify-payment
    // Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, planCode }
    // Called from frontend after checkout.onSuccess callback
    @PostMapping("/verify-payment")
    public ResponseEntity<SubscriptionDto> verifyPayment(
            @AuthenticationPrincipal String email,
            @RequestBody VerifyPaymentRequest req) {
        return ResponseEntity.ok(
            subscriptionService.verifyAndActivate(getTenantId(email), req)
        );
    }

    // POST /api/v1/subscription/webhook
    // Called by Razorpay directly — NO JWT auth, uses HMAC signature verification instead
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            HttpServletRequest httpRequest,
            @RequestBody String payload) {
        String signature = httpRequest.getHeader("X-Razorpay-Signature");
        subscriptionService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }

    // GET /api/v1/subscription/can-add-device
    @GetMapping("/can-add-device")
    public ResponseEntity<Map<String, Boolean>> canAddDevice(@AuthenticationPrincipal String email) {
        boolean can = subscriptionService.canAddDevice(getTenantId(email));
        return ResponseEntity.ok(Map.of("canAdd", can));
    }

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email).map(u -> u.getTenantId()).orElseThrow();
    }
}
