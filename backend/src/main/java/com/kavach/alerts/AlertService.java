package com.kavach.alerts;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public Alert create(Alert alert) {
        alert.setCreatedAt(Instant.now());
        if (alert.getTimestamp() == null) alert.setTimestamp(Instant.now());
        return alertRepository.save(alert);
    }

    public List<Alert> getAll() {
        return alertRepository.findAll();
    }

    public List<Alert> getUnread() {
        return alertRepository.findByReadFalseOrderByTimestampDesc();
    }

    public long getUnreadCount() {
        return alertRepository.countUnread();
    }

    public Alert markRead(UUID id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));
        alert.setRead(true);
        return alertRepository.save(alert);
    }

    public List<Alert> getByDevice(UUID deviceId) {
        return alertRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
    }

    public List<Alert> getBySeverity(String severity) {
        return alertRepository.findBySeverityOrderByTimestampDesc(severity);
    }
}
