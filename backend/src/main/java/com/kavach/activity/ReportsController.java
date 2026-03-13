package com.kavach.activity;

import com.kavach.activity.dto.*;
import com.kavach.activity.service.ReportingService;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.awt.*;
import java.io.ByteArrayOutputStream;
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

    // GET /api/v1/reports/device/{deviceId}/export?format=csv|pdf&period=daily|weekly|monthly
    @GetMapping("/device/{deviceId}/export")
    public ResponseEntity<?> exportReport(
            @PathVariable UUID deviceId,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(defaultValue = "weekly") String period) {

        String baseName = String.format("kavach-report-%s-%s-%s",
                deviceId.toString().substring(0, 8), period, LocalDate.now());

        if ("pdf".equalsIgnoreCase(format)) {
            byte[] pdf = buildPdf(deviceId, period);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=\"" + baseName + ".pdf\"")
                    .body(pdf);
        }

        // Default: CSV
        String csv = reportingService.exportToCsv(deviceId, period);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"" + baseName + ".csv\"")
                .body(csv);
    }

    // ── PDF builder (OpenPDF) ─────────────────────────────────────────────────

    private byte[] buildPdf(UUID deviceId, String period) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 60, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Fonts ──────────────────────────────────────────────────────────
            Font titleFont  = new Font(Font.HELVETICA, 20, Font.BOLD,   new Color(30, 42, 69));
            Font headFont   = new Font(Font.HELVETICA, 13, Font.BOLD,   new Color(30, 42, 69));
            Font labelFont  = new Font(Font.HELVETICA, 10, Font.BOLD,   new Color(100, 116, 139));
            Font valueFont  = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(30, 42, 69));
            Font smallFont  = new Font(Font.HELVETICA,  8, Font.NORMAL, new Color(148, 163, 184));

            // ── Header ─────────────────────────────────────────────────────────
            Paragraph header = new Paragraph("KAVACH AI — Usage Report", titleFont);
            header.setAlignment(Element.ALIGN_LEFT);
            doc.add(header);

            Paragraph meta = new Paragraph(
                    "Device: " + deviceId + "   |   Period: " + period.toUpperCase()
                    + "   |   Generated: " + LocalDate.now(), smallFont);
            meta.setSpacingAfter(14);
            doc.add(meta);

            // ── Weekly summary ─────────────────────────────────────────────────
            LocalDate end = LocalDate.now();
            WeeklyReportDto weekly = "monthly".equalsIgnoreCase(period)
                    ? reportingService.getMonthlyReport(deviceId, end)
                    : reportingService.getWeeklyReport(deviceId, end);

            doc.add(new Paragraph("Summary", headFont));
            doc.add(new Paragraph(" "));

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(60);
            summaryTable.setSpacingAfter(14);
            addTableRow(summaryTable, "Total Screen Time", weekly.getTotalScreenTimeFormatted(),
                    labelFont, valueFont);
            addTableRow(summaryTable, "Avg Daily Hours",
                    String.format("%.1f h", weekly.getAvgDailyHours()), labelFont, valueFont);
            doc.add(summaryTable);

            // ── Daily breakdown ────────────────────────────────────────────────
            doc.add(new Paragraph("Daily Breakdown", headFont));
            doc.add(new Paragraph(" "));

            PdfPTable dayTable = new PdfPTable(3);
            dayTable.setWidthPercentage(100);
            dayTable.setSpacingAfter(14);
            addTableHeader(dayTable, new String[]{"Date", "Day", "Screen Time"}, labelFont);
            for (WeeklyReportDto.DaySlot day : weekly.getDays()) {
                long seconds = day.getTotalSeconds();
                String formatted = String.format("%dh %02dm", seconds / 3600, (seconds % 3600) / 60);
                addCell(dayTable, day.getDate(), valueFont);
                addCell(dayTable, day.getDayLabel(), valueFont);
                addCell(dayTable, formatted, valueFont);
            }
            doc.add(dayTable);

            // ── Top apps ──────────────────────────────────────────────────────
            AppUsageDto apps = reportingService.getTopApps(deviceId, end.minusDays(6), end);
            if (apps != null && !apps.getApps().isEmpty()) {
                doc.add(new Paragraph("Top Apps (7 Days)", headFont));
                doc.add(new Paragraph(" "));

                PdfPTable appTable = new PdfPTable(4);
                appTable.setWidthPercentage(100);
                appTable.setSpacingAfter(14);
                addTableHeader(appTable, new String[]{"Rank", "App", "Category", "Duration"}, labelFont);
                for (AppUsageDto.AppEntry app : apps.getApps()) {
                    addCell(appTable, String.valueOf(app.getRank()), valueFont);
                    addCell(appTable, app.getAppName(), valueFont);
                    addCell(appTable, app.getCategory(), valueFont);
                    addCell(appTable, app.getDurationFormatted()
                            + (app.isBlocked() ? " [BLOCKED]" : ""), valueFont);
                }
                doc.add(appTable);
            }

            // ── Footer ─────────────────────────────────────────────────────────
            Paragraph footer = new Paragraph(
                    "This report was generated automatically by KAVACH AI. Confidential.", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    private void addTableHeader(PdfPTable table, String[] headers, Font font) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, font));
            cell.setBackgroundColor(new Color(241, 245, 249));
            cell.setPadding(6);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value,
                              Font labelFont, Font valueFont) {
        addCell(table, label, labelFont);
        addCell(table, value, valueFont);
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setPadding(5);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }
}
