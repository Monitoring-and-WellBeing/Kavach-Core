package com.kavach.devices.repository;

import com.kavach.devices.entity.DeviceLinkCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface DeviceLinkCodeRepository extends JpaRepository<DeviceLinkCode, UUID> {
    Optional<DeviceLinkCode> findByCodeAndUsedFalse(String code);
    Optional<DeviceLinkCode> findByCode(String code);

    @Modifying
    @Query("DELETE FROM DeviceLinkCode c WHERE c.expiresAt < :now AND c.used = false")
    void deleteExpiredCodes(LocalDateTime now);
}
