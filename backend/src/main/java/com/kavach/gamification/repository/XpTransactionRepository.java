package com.kavach.gamification.repository;

import com.kavach.gamification.entity.XpTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface XpTransactionRepository extends JpaRepository<XpTransaction, UUID> {

    // Total XP from challenges/manual grants for a device
    @Query("SELECT COALESCE(SUM(x.amount), 0) FROM XpTransaction x WHERE x.deviceId = :deviceId")
    long totalXpByDevice(@Param("deviceId") UUID deviceId);
}
