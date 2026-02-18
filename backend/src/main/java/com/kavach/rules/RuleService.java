package com.kavach.rules;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RuleService {

    private final RuleRepository ruleRepository;

    public Rule create(Rule rule) {
        rule.setCreatedAt(Instant.now());
        return ruleRepository.save(rule);
    }

    public List<Rule> findByTenantId(UUID tenantId) {
        return ruleRepository.findByTenantId(tenantId);
    }

    public Rule findById(UUID id) {
        return ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rule not found: " + id));
    }

    public Rule update(UUID id, Rule updates) {
        Rule rule = findById(id);
        if (updates.getName() != null) rule.setName(updates.getName());
        if (updates.getStatus() != null) rule.setStatus(updates.getStatus());
        if (updates.getTarget() != null) rule.setTarget(updates.getTarget());
        if (updates.getLimitMinutes() != null) rule.setLimitMinutes(updates.getLimitMinutes());
        return ruleRepository.save(rule);
    }

    public void delete(UUID id) {
        ruleRepository.deleteById(id);
    }

    public Rule toggleStatus(UUID id) {
        Rule rule = findById(id);
        rule.setStatus("ACTIVE".equals(rule.getStatus()) ? "PAUSED" : "ACTIVE");
        return ruleRepository.save(rule);
    }

    public List<Rule> getActiveRulesForDevice(UUID deviceId) {
        return ruleRepository.findByDeviceId(deviceId).stream()
                .filter(r -> "ACTIVE".equals(r.getStatus()))
                .toList();
    }
}
