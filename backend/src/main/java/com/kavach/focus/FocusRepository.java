package com.kavach.focus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FocusRepository extends JpaRepository<FocusSession, UUID> {
    Optional<FocusSession> findFirstByDeviceIdAndStatusOrderByStartTimeDesc(UUID deviceId, String status);
    List<FocusSession> findByDeviceIdOrderByStartTimeDesc(UUID deviceId);
}
