package com.kavach.rules;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RuleRepository extends JpaRepository<Rule, UUID> {
    List<Rule> findByTenantId(UUID tenantId);
    List<Rule> findByDeviceId(UUID deviceId);
    List<Rule> findByTenantIdAndStatus(UUID tenantId, String status);
}
