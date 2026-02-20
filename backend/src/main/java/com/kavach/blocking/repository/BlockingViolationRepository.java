package com.kavach.blocking.repository;

import com.kavach.blocking.entity.BlockingViolation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BlockingViolationRepository extends JpaRepository<BlockingViolation, UUID> {

    List<BlockingViolation> findTop20ByDeviceIdOrderByAttemptedAtDesc(UUID deviceId);

    long countByDeviceIdAndAttemptedAtAfter(UUID deviceId, LocalDateTime since);

    long countByTenantIdAndAttemptedAtAfter(UUID tenantId, LocalDateTime since);
}
