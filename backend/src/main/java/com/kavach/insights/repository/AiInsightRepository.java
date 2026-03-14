package com.kavach.insights.repository;

import com.kavach.insights.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiInsightRepository extends JpaRepository<AiInsight, UUID> {
    Optional<AiInsight> findTopByDeviceIdOrderByGeneratedAtDesc(UUID deviceId);
}
