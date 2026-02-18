package com.kavach.insights;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InsightRepository extends JpaRepository<Insight, UUID> {
    List<Insight> findByDeviceIdAndDismissedFalseOrderByGeneratedAtDesc(UUID deviceId);
    List<Insight> findByDeviceIdInAndDismissedFalseOrderByGeneratedAtDesc(List<UUID> deviceIds);
}
