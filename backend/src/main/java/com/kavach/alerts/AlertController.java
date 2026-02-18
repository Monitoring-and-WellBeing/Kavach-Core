package com.kavach.alerts;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<Alert>> getAll(
            @RequestParam(required = false) String severity
    ) {
        if (severity != null) {
            return ResponseEntity.ok(alertService.getBySeverity(severity));
        }
        return ResponseEntity.ok(alertService.getAll());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Alert>> getUnread() {
        return ResponseEntity.ok(alertService.getUnread());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", alertService.getUnreadCount()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Alert> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(alertService.markRead(id));
    }

    @PostMapping
    public ResponseEntity<Alert> create(@RequestBody Alert alert) {
        return ResponseEntity.ok(alertService.create(alert));
    }
}
