package com.kavach.insights;

import com.kavach.devices.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InsightService {

    private final InsightRepository insightRepository;
    private final DeviceRepository deviceRepository;

    public List<Insight> getDeviceInsights(UUID deviceId) {
        return insightRepository.findByDeviceIdAndDismissedFalseOrderByGeneratedAtDesc(deviceId);
    }

    public List<Insight> getParentInsights(UUID parentId) {
        // Get all devices for this parent's children
        // For now, return mock data
        List<UUID> deviceIds = deviceRepository.findAll().stream()
            .map(d -> d.getId())
            .limit(5)
            .toList();
        
        return insightRepository.findByDeviceIdInAndDismissedFalseOrderByGeneratedAtDesc(deviceIds);
    }

    public void dismissInsight(UUID insightId) {
        Insight insight = insightRepository.findById(insightId)
            .orElseThrow(() -> new RuntimeException("Insight not found"));
        insight.setDismissed(true);
        insightRepository.save(insight);
    }
}
