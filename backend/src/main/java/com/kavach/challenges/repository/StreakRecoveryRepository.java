package com.kavach.challenges.repository;

import com.kavach.challenges.entity.StreakRecovery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StreakRecoveryRepository extends JpaRepository<StreakRecovery, UUID> {
    Optional<StreakRecovery> findByDeviceId(UUID deviceId);
}
