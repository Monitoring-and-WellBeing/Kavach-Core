package com.kavach.ai.repository;

import com.kavach.ai.entity.DailyMotivation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DailyMotivationRepository extends JpaRepository<DailyMotivation, UUID> {

    Optional<DailyMotivation> findByDeviceIdAndCacheDate(UUID deviceId, LocalDate cacheDate);
}
