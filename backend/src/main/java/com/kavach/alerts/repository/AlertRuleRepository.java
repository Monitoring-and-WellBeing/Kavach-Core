package com.kavach.alerts.repository;

import com.kavach.alerts.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AlertRuleRepository extends JpaRepository<AlertRule, UUID> {
    List<AlertRule> findByTenantIdAndActiveTrue(UUID tenantId);
    List<AlertRule> findByTenantId(UUID tenantId);
}
