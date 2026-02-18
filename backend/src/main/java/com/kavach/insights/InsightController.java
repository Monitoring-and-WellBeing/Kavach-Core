package com.kavach.insights;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<Insight>> getDeviceInsights(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(insightService.getDeviceInsights(deviceId));
    }

    @GetMapping("/parent/{parentId}")
    public ResponseEntity<List<Insight>> getParentInsights(@PathVariable UUID parentId) {
        return ResponseEntity.ok(insightService.getParentInsights(parentId));
    }

    @PostMapping("/{insightId}/dismiss")
    public ResponseEntity<Void> dismissInsight(@PathVariable UUID insightId) {
        insightService.dismissInsight(insightId);
        return ResponseEntity.ok().build();
    }
}
