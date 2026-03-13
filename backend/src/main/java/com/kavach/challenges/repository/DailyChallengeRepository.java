package com.kavach.challenges.repository;

import com.kavach.challenges.entity.DailyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DailyChallengeRepository extends JpaRepository<DailyChallenge, UUID> {

    // Today's challenges for a device
    @Query("SELECT dc FROM DailyChallenge dc LEFT JOIN FETCH dc.template " +
           "WHERE dc.deviceId = :deviceId AND dc.challengeDate = :date")
    List<DailyChallenge> findByDeviceIdAndDate(
        @Param("deviceId") UUID deviceId,
        @Param("date") LocalDate date);

    // Today's challenges for a device filtered by type (via template join)
    @Query("SELECT dc FROM DailyChallenge dc LEFT JOIN FETCH dc.template t " +
           "WHERE dc.deviceId = :deviceId AND dc.challengeDate = :date " +
           "AND t.challengeType = :challengeType")
    List<DailyChallenge> findByDeviceIdAndDateAndType(
        @Param("deviceId") UUID deviceId,
        @Param("date") LocalDate date,
        @Param("challengeType") String challengeType);

    // Challenge status for parent view (all devices on a tenant for today)
    @Query("SELECT dc FROM DailyChallenge dc LEFT JOIN FETCH dc.template " +
           "WHERE dc.tenantId = :tenantId AND dc.challengeDate = :date")
    List<DailyChallenge> findByTenantIdAndDate(
        @Param("tenantId") UUID tenantId,
        @Param("date") LocalDate date);
}
