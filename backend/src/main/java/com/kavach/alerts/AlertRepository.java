package com.kavach.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findByDeviceIdOrderByTimestampDesc(UUID deviceId);

    List<Alert> findByReadFalseOrderByTimestampDesc();

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.read = false")
    long countUnread();

    List<Alert> findBySeverityOrderByTimestampDesc(String severity);
}
