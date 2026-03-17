package com.kavach.rules;

import com.kavach.blocking.service.BlockingService;
import com.kavach.sse.SseRegistry;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rules")
@RequiredArgsConstructor
public class RuleController {

    private final RuleService ruleService;
    private final BlockingService blockingService;
    private final SseRegistry sseRegistry;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Rule>> getRules(@RequestParam UUID tenantId) {
        return ResponseEntity.ok(ruleService.findByTenantId(tenantId));
    }

    @PostMapping
    public ResponseEntity<Rule> create(@RequestBody Rule rule,
                                       @AuthenticationPrincipal String email) {
        Rule created = ruleService.create(rule);
        UUID tenantId = resolveTenantId(email, created.getTenantId());
        if (tenantId != null) {
            if (isBlockingType(created.getType())) {
                userRepository.findByEmail(email)
                        .map(u -> u.getId())
                        .ifPresent(userId -> blockingService.createBlockRuleFromInstituteRule(created, userId));
            }
            Map<String, Object> payload = Map.of("action", "created",
                    "ruleId", created.getId().toString(), "ts", System.currentTimeMillis());
            sseRegistry.sendToTenantDevices(tenantId, "rules_updated", payload);
            sseRegistry.sendToTenant(tenantId, "rules_updated", payload);
        }
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rule> update(@PathVariable UUID id,
                                       @RequestBody Rule updates,
                                       @AuthenticationPrincipal String email) {
        Rule updated = ruleService.update(id, updates);
        UUID tenantId = resolveTenantId(email, updated.getTenantId());
        if (tenantId != null) {
            Map<String, Object> payload = Map.of("action", "updated",
                    "ruleId", id.toString(), "ts", System.currentTimeMillis());
            sseRegistry.sendToTenantDevices(tenantId, "rules_updated", payload);
            sseRegistry.sendToTenant(tenantId, "rules_updated", payload);
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal String email) {
        Rule rule = ruleService.findById(id);
        UUID tenantId = resolveTenantId(email, rule.getTenantId());
        ruleService.delete(id);
        if (tenantId != null) {
            Map<String, Object> payload = Map.of("action", "deleted",
                    "ruleId", id.toString(), "ts", System.currentTimeMillis());
            sseRegistry.sendToTenantDevices(tenantId, "rules_updated", payload);
            sseRegistry.sendToTenant(tenantId, "rules_updated", payload);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> sync(@PathVariable UUID id,
                                                     @AuthenticationPrincipal String email) {
        Rule rule = ruleService.findById(id);
        UUID tenantId = resolveTenantId(email, rule.getTenantId());
        Map<String, Object> payload = Map.of("action", "synced",
                "ruleId", id.toString(), "ts", System.currentTimeMillis());
        if (rule.getDeviceId() != null) {
            sseRegistry.sendToDevice(rule.getDeviceId().toString(), "rules_updated", payload);
        } else if (tenantId != null) {
            sseRegistry.sendToTenantDevices(tenantId, "rules_updated", payload);
        }
        return ResponseEntity.ok(Map.of("status", "pushed", "ruleId", id.toString()));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Rule> toggle(@PathVariable UUID id,
                                       @AuthenticationPrincipal String email) {
        Rule toggled = ruleService.toggleStatus(id);
        UUID tenantId = resolveTenantId(email, toggled.getTenantId());
        if (tenantId != null) {
            Map<String, Object> payload = Map.of("action", "toggled",
                    "ruleId", id.toString(), "newStatus", toggled.getStatus(),
                    "ts", System.currentTimeMillis());
            sseRegistry.sendToTenantDevices(tenantId, "rules_updated", payload);
            sseRegistry.sendToTenant(tenantId, "rules_updated", payload);
        }
        return ResponseEntity.ok(toggled);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UUID resolveTenantId(String email, UUID fallback) {
        if (email == null) return fallback;
        return userRepository.findByEmail(email)
                .map(u -> u.getTenantId())
                .orElse(fallback);
    }

    private static boolean isBlockingType(String type) {
        return "CATEGORY_BLOCK".equals(type) || "WEBSITE_BLOCK".equals(type)
                || "APP_LIMIT".equals(type) || "SCHEDULE_BLOCK".equals(type);
    }
}
