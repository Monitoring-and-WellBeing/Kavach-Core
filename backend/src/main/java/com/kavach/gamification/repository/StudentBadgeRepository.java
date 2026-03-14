package com.kavach.gamification.repository;

import com.kavach.gamification.entity.StudentBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentBadgeRepository extends JpaRepository<StudentBadge, UUID> {

    List<StudentBadge> findByDeviceIdOrderByEarnedAtDesc(UUID deviceId);

    Optional<StudentBadge> findByDeviceIdAndBadgeId(UUID deviceId, UUID badgeId);

    boolean existsByDeviceIdAndBadgeId(UUID deviceId, UUID badgeId);

    long countByDeviceId(UUID deviceId);

    // Total XP earned by device
    @Query(value = "SELECT COALESCE(SUM(b.xp_reward), 0) FROM student_badges sb " +
           "JOIN badges b ON sb.badge_id = b.id WHERE sb.device_id = :deviceId", nativeQuery = true)
    long totalXpByDevice(@Param("deviceId") UUID deviceId);
}
