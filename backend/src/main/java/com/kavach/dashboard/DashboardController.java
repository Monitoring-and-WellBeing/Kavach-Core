package com.kavach.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentDashboard(@PathVariable UUID studentId) {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(studentId));
    }

    @GetMapping("/parent/{parentId}")
    public ResponseEntity<Map<String, Object>> getParentDashboard(@PathVariable UUID parentId) {
        return ResponseEntity.ok(dashboardService.getParentDashboard(parentId));
    }

    @GetMapping("/institute/{tenantId}")
    public ResponseEntity<Map<String, Object>> getInstituteDashboard(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(dashboardService.getInstituteDashboard(tenantId));
    }
}
