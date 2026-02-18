package com.kavach.focus;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices/{deviceId}/focus")
@RequiredArgsConstructor
public class FocusController {

    private final FocusRepository focusRepository;

    @PostMapping("/start")
    public ResponseEntity<FocusSession> start(
            @PathVariable UUID deviceId,
            @RequestBody FocusSession request
    ) {
        request.setDeviceId(deviceId);
        request.setStartTime(Instant.now());
        request.setStatus("ACTIVE");
        request.setCreatedAt(Instant.now());
        return ResponseEntity.ok(focusRepository.save(request));
    }

    @PostMapping("/end")
    public ResponseEntity<FocusSession> end(@PathVariable UUID deviceId) {
        Optional<FocusSession> active = focusRepository
                .findFirstByDeviceIdAndStatusOrderByStartTimeDesc(deviceId, "ACTIVE");

        if (active.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        FocusSession session = active.get();
        session.setEndTime(Instant.now());
        session.setStatus("ENDED");
        long elapsed = (Instant.now().toEpochMilli() - session.getStartTime().toEpochMilli()) / 60000;
        session.setDurationMinutes((int) elapsed);
        return ResponseEntity.ok(focusRepository.save(session));
    }

    @GetMapping("/current")
    public ResponseEntity<FocusSession> getCurrent(@PathVariable UUID deviceId) {
        return focusRepository
                .findFirstByDeviceIdAndStatusOrderByStartTimeDesc(deviceId, "ACTIVE")
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/history")
    public ResponseEntity<List<FocusSession>> getHistory(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(focusRepository.findByDeviceIdOrderByStartTimeDesc(deviceId));
    }
}
