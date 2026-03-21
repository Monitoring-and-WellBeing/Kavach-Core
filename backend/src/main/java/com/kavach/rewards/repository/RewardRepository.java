package com.kavach.rewards.repository;

import com.kavach.rewards.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {

    List<Reward> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Reward> findByTenantIdAndActiveTrueOrderByXpCostAsc(UUID tenantId);

    Optional<Reward> findByIdAndTenantId(UUID id, UUID tenantId);
}
