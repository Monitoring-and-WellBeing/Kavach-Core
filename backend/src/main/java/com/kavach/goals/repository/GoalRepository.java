package com.kavach.goals.repository;

import com.kavach.goals.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface GoalRepository extends JpaRepository<Goal, UUID> {
    List<Goal> findByDeviceIdAndActiveTrue(UUID deviceId);
    List<Goal> findByTenantIdAndActiveTrue(UUID tenantId);
}
