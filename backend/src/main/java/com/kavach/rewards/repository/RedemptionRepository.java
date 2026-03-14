package com.kavach.rewards.repository;

import com.kavach.rewards.entity.RedemptionStatus;
import com.kavach.rewards.entity.RewardRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RedemptionRepository extends JpaRepository<RewardRedemption, UUID> {

    List<RewardRedemption> findByTenantIdAndStatusOrderByRequestedAtDesc(
        UUID tenantId, RedemptionStatus status);

    List<RewardRedemption> findByStudentUserIdOrderByRequestedAtDesc(UUID studentUserId);

    Optional<RewardRedemption> findByIdAndTenantId(UUID id, UUID tenantId);

    /** Total XP spent on non-denied redemptions for a device (counts PENDING + APPROVED + FULFILLED) */
    @Query(value = """
        SELECT COALESCE(SUM(xp_spent), 0)
        FROM reward_redemptions
        WHERE device_id = :deviceId
          AND status IN ('PENDING', 'APPROVED', 'FULFILLED')
        """, nativeQuery = true)
    long totalXpSpentByDevice(@Param("deviceId") UUID deviceId);
}
