package com.kavach.subscription;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;

    @GetMapping("/{tenantId}")
    public ResponseEntity<Subscription> getByTenant(@PathVariable UUID tenantId) {
        return subscriptionRepository.findByTenantId(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upgrade")
    public ResponseEntity<Subscription> upgrade(@RequestBody Map<String, Object> body) {
        UUID tenantId = UUID.fromString(body.get("tenantId").toString());
        String plan = body.get("plan").toString();
        String billingCycle = body.getOrDefault("billingCycle", "MONTHLY").toString();

        Subscription sub = subscriptionRepository.findByTenantId(tenantId)
                .orElse(new Subscription());

        sub.setTenantId(tenantId);
        sub.setPlan(plan);
        sub.setBillingCycle(billingCycle);
        sub.setStatus("ACTIVE");
        sub.setStartDate(LocalDate.now());
        sub.setEndDate("ANNUAL".equals(billingCycle)
                ? LocalDate.now().plusYears(1)
                : LocalDate.now().plusMonths(1));

        // Set device limits per plan
        switch (plan) {
            case "STARTER" -> { sub.setDeviceLimit(50); sub.setPricePerDevice(new BigDecimal("100")); }
            case "INSTITUTE" -> { sub.setDeviceLimit(300); sub.setPricePerDevice(new BigDecimal("150")); }
            case "ENTERPRISE" -> { sub.setDeviceLimit(99999); sub.setPricePerDevice(BigDecimal.ZERO); }
            default -> { sub.setDeviceLimit(5); sub.setPricePerDevice(BigDecimal.ZERO); }
        }

        if (sub.getCreatedAt() == null) sub.setCreatedAt(Instant.now());

        return ResponseEntity.ok(subscriptionRepository.save(sub));
    }

    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPlans() {
        return ResponseEntity.ok(List.of(
                Map.of("plan", "FREE_TRIAL", "devices", 5, "price", 0, "annualPrice", 0),
                Map.of("plan", "STARTER", "devices", 50, "price", 100, "annualPrice", 80),
                Map.of("plan", "INSTITUTE", "devices", 300, "price", 150, "annualPrice", 120),
                Map.of("plan", "ENTERPRISE", "devices", "Unlimited", "price", "Custom", "annualPrice", "Custom")
        ));
    }
}
