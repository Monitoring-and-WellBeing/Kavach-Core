package com.kavach.activity;

import com.kavach.activity.dto.*;
import com.kavach.activity.service.ReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportingService reportingService;

    // GET /api/v1/reports/device/{deviceId}/daily?date=2026-02-18
    @GetMapping("/device/{deviceId}/daily")
    public ResponseEntity<DailyReportDto> getDaily(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reportingService.getDailyReport(deviceId, targetDate));
    }

    // GET /api/v1/reports/device/{deviceId}/weekly?endDate=2026-02-18
    @GetMapping("/device/{deviceId}/weekly")
    public ResponseEntity<WeeklyReportDto> getWeekly(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(reportingService.getWeeklyReport(deviceId, end));
    }

    // GET /api/v1/reports/device/{deviceId}/monthly
    @GetMapping("/device/{deviceId}/monthly")
    public ResponseEntity<WeeklyReportDto> getMonthly(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(reportingService.getMonthlyReport(deviceId, end));
    }

    // GET /api/v1/reports/device/{deviceId}/apps?startDate=...&endDate=...
    @GetMapping("/device/{deviceId}/apps")
    public ResponseEntity<AppUsageDto> getTopApps(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(6);
        return ResponseEntity.ok(reportingService.getTopApps(deviceId, start, end));
    }

    // GET /api/v1/reports/device/{deviceId}/categories?startDate=...&endDate=...
    @GetMapping("/device/{deviceId}/categories")
    public ResponseEntity<CategoryBreakdownDto> getCategories(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate end   = endDate   != null ? endDate   : LocalDate.now();
        LocalDate start = startDate != null ? startDate : end.minusDays(6);
        return ResponseEntity.ok(reportingService.getCategoryBreakdown(deviceId, start, end));
    }

    // GET /api/v1/reports/device/{deviceId}/heatmap
    @GetMapping("/device/{deviceId}/heatmap")
    public ResponseEntity<HeatmapDto> getHeatmap(
            @PathVariable UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(reportingService.getHeatmap(deviceId, end));
    }

    // GET /api/v1/reports/device/{deviceId}/export?format=csv&period=weekly
    @GetMapping("/device/{deviceId}/export")
    public ResponseEntity<?> exportReport(
            @PathVariable UUID deviceId,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(defaultValue = "weekly") String period) {
        
        if ("pdf".equalsIgnoreCase(format)) {
            return ResponseEntity.status(501).body(
                java.util.Map.of("error", "PDF export coming soon. Use CSV for now.")
            );
        }

        // Generate CSV
        String csv = reportingService.exportToCsv(deviceId, period);
        String filename = String.format("kavach-report-%s-%s-%s.csv",
            deviceId.toString().substring(0, 8),
            period,
            LocalDate.now().toString());

        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
            .body(csv);
    }
}
