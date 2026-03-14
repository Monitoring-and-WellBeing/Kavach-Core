package com.kavach.dashboard;

import com.kavach.activity.entity.ActivityLog;
import com.kavach.activity.repository.ActivityLogRepository;
import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.blocking.repository.BlockingViolationRepository;
import com.kavach.devices.entity.Device;
import com.kavach.devices.entity.DeviceStatus;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.focus.entity.FocusSession;
import com.kavach.focus.repository.FocusSessionRepository;
import com.kavach.users.Role;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private DeviceRepository deviceRepository;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private BlockingViolationRepository violationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID tenantId;
    private UUID studentId;
    private UUID parentId;
    private UUID deviceId;
    private User student;
    private User parent;
    private Device device;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        parentId = UUID.randomUUID();
        deviceId = UUID.randomUUID();

        student = new User();
        student.setId(studentId);
        student.setTenantId(tenantId);
        student.setName("Test Student");
        student.setEmail("student@test.com");
        student.setRole(Role.STUDENT);

        parent = new User();
        parent.setId(parentId);
        parent.setTenantId(tenantId);
        parent.setName("Test Parent");
        parent.setEmail("parent@test.com");
        parent.setRole(Role.PARENT);

        device = new Device();
        device.setId(deviceId);
        device.setTenantId(tenantId);
        device.setName("Test Device");
        device.setAssignedTo("Test Student"); // Must match student.getName()
        device.setStatus(DeviceStatus.ONLINE);
        device.setActive(true);
        
        // Ensure student name matches device assignedTo for matching logic
        assert student.getName().equals(device.getAssignedTo());
    }

    @Test
    void testGetStudentDashboard_WithDevice() {
        // Given
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(deviceRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of(device));
        when(activityLogRepository.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(3600L); // 1 hour
        when(focusSessionRepository.totalFocusMinutesSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(30L);
        // Mock countCompletedSince for both focus sessions today and streak calculation
        when(focusSessionRepository.countCompletedSince(eq(deviceId), any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    LocalDateTime since = invocation.getArgument(1);
                    LocalDate sinceDate = since.toLocalDate();
                    LocalDate today = LocalDate.now();
                    // Return 2 for today (for focusSessionsToday), 0 for past days (for streak)
                    return sinceDate.equals(today) ? 2L : 0L;
                });
        Object[] topAppRow = new Object[]{"Chrome", "PRODUCTIVITY", 1800L};
        List<Object[]> topApps = new ArrayList<>();
        topApps.add(topAppRow);
        when(activityLogRepository.topAppsSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(topApps);
        Object[] categoryRow = new Object[]{"EDUCATION", 1800L};
        List<Object[]> categories = new ArrayList<>();
        categories.add(categoryRow);
        when(activityLogRepository.categoryBreakdown(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(categories);
        when(activityLogRepository.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                eq(deviceId), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());
        when(focusSessionRepository.findByDeviceIdAndStatus(eq(deviceId), eq("ACTIVE")))
                .thenReturn(Optional.empty());

        // When
        Map<String, Object> result = dashboardService.getStudentDashboard(studentId);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("deviceLinked"), "Device should be linked");
        assertEquals(deviceId.toString(), result.get("deviceId"));
        assertTrue(result.containsKey("focusScore"), "Should have focusScore");
        assertTrue(result.containsKey("currentStreak"), "Should have currentStreak field");
        assertTrue(result.containsKey("topApps"), "Should have topApps");
        assertTrue(result.containsKey("weeklyData"), "Should have weeklyData");
    }

    @Test
    void testGetStudentDashboard_NoDevice() {
        // Given
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(deviceRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of());

        // When
        Map<String, Object> result = dashboardService.getStudentDashboard(studentId);

        // Then
        assertNotNull(result);
        assertFalse((Boolean) result.get("deviceLinked"));
        assertTrue(result.containsKey("message"));
    }

    @Test
    void testGetParentDashboard() {
        // Given
        when(userRepository.findById(parentId)).thenReturn(Optional.of(parent));
        when(deviceRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of(device));
        when(activityLogRepository.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(7200L);
        when(focusSessionRepository.countCompletedSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(3L);
        when(violationRepository.countByTenantIdAndAttemptedAtAfter(eq(tenantId), any(LocalDateTime.class)))
                .thenReturn(5L);
        when(alertRepository.countByTenantIdAndReadFalseAndDismissedFalse(eq(tenantId)))
                .thenReturn(2L);
        org.springframework.data.domain.Page<Alert> emptyPage2 = 
                org.springframework.data.domain.Page.empty();
        when(alertRepository.findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(
                any(), any())).thenReturn(emptyPage2);
        when(activityLogRepository.topAppsSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(activityLogRepository.findByDeviceIdAndStartedAtBetweenOrderByStartedAtDesc(
                eq(deviceId), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of());

        // When
        Map<String, Object> result = dashboardService.getParentDashboard(parentId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.get("totalDevices"));
        assertTrue(result.containsKey("onlineNow"));
        assertTrue(result.containsKey("alertsToday"));
        assertTrue(result.containsKey("topApps"));
        assertTrue(result.containsKey("activityHeatmap"));
    }

    @Test
    void testGetInstituteDashboard() {
        // Given
        when(deviceRepository.findByTenantIdAndActiveTrue(tenantId))
                .thenReturn(List.of(device));
        when(alertRepository.countByTenantIdAndTriggeredAtAfter(eq(tenantId), any(LocalDateTime.class)))
                .thenReturn(10L);
        when(activityLogRepository.totalDurationSince(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(10800L);
        when(focusSessionRepository.findByDeviceIdAndStatus(eq(deviceId), eq("ACTIVE")))
                .thenReturn(Optional.empty());
        Object[] categoryRow2 = new Object[]{"EDUCATION", 5400L};
        List<Object[]> categories2 = new ArrayList<>();
        categories2.add(categoryRow2);
        when(activityLogRepository.categoryBreakdown(eq(deviceId), any(LocalDateTime.class)))
                .thenReturn(categories2);
        org.springframework.data.domain.Page<Alert> emptyPage3 = 
                org.springframework.data.domain.Page.empty();
        when(alertRepository.findByTenantIdAndDismissedFalseOrderByTriggeredAtDesc(
                any(), any())).thenReturn(emptyPage3);

        // When
        Map<String, Object> result = dashboardService.getInstituteDashboard(tenantId);

        // Then
        assertNotNull(result);
        assertEquals(1L, result.get("totalDevices"));
        assertTrue(result.containsKey("complianceScore"));
        assertTrue(result.containsKey("deviceStatusHeatmap"));
        assertTrue(result.containsKey("categoryBreakdown"));
        assertTrue(result.containsKey("criticalAlerts"));
    }
}
