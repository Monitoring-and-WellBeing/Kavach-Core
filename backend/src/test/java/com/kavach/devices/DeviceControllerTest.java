package com.kavach.devices;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kavach.devices.dto.DeviceDto;
import com.kavach.devices.dto.LinkDeviceRequest;
import com.kavach.devices.service.DeviceService;
import com.kavach.focus.service.FocusService;
import com.kavach.users.Role;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import com.kavach.config.TestSecurityConfig;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Feature 02 — Device Controller")
class DeviceControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean DeviceService deviceService;
    @MockBean UserRepository userRepo;
    @MockBean FocusService focusService;

    private User mockUser;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockUser.setEmail("parent@demo.com");
        mockUser.setTenantId(tenantId);
        mockUser.setRole(Role.PARENT);
        mockUser.setActive(true);
        // Mock userRepo to return the user for any email lookup (in case @WithMockUser uses different format)
        when(userRepo.findByEmail(any(String.class))).thenReturn(Optional.of(mockUser));
    }

    @Test
    @TestSecurityConfig.WithMockEmail(value = "parent@demo.com", roles = {"PARENT"})
    @DisplayName("GET /devices returns 200 with device list")
    void getDevices_returns200() throws Exception {
        when(deviceService.getDevicesByTenant(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/devices"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /devices without auth returns 403")
    void getDevices_withoutAuth_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/devices"))
            .andExpect(status().isForbidden());
    }

    @Test
    @TestSecurityConfig.WithMockEmail(value = "parent@demo.com", roles = {"PARENT"})
    @DisplayName("POST /devices/{id}/pause returns 200")
    void pauseDevice_returns200() throws Exception {
        DeviceDto mockDto = DeviceDto.builder()
            .id(UUID.randomUUID())
            .name("Test Device")
            .status("PAUSED")
            .build();
        when(deviceService.pauseDevice(any(), any())).thenReturn(mockDto);

        mockMvc.perform(post("/api/v1/devices/{id}/pause", UUID.randomUUID().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAUSED"));
    }

    @Test
    @TestSecurityConfig.WithMockEmail(value = "parent@demo.com", roles = {"PARENT"})
    @DisplayName("POST /devices/link returns 201 when successful")
    void linkDevice_returns201() throws Exception {
        DeviceDto mockDto = DeviceDto.builder()
            .id(UUID.randomUUID())
            .name("New Device")
            .status("OFFLINE")
            .build();
        when(deviceService.linkDevice(any(), any())).thenReturn(mockDto);

        LinkDeviceRequest req = new LinkDeviceRequest();
        req.setCode("ABC123");
        req.setDeviceName("New Device");

        mockMvc.perform(post("/api/v1/devices/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("New Device"));
    }

    @Test
    @TestSecurityConfig.WithMockEmail(value = "parent@demo.com", roles = {"PARENT"})
    @DisplayName("POST /devices/link returns 403 when device limit reached")
    void linkDevice_returns403WhenAtLimit() throws Exception {
        when(deviceService.linkDevice(any(), any()))
            .thenThrow(new IllegalArgumentException("Device limit reached for your plan"));

        LinkDeviceRequest req = new LinkDeviceRequest();
        req.setCode("ABC123");

        mockMvc.perform(post("/api/v1/devices/link")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").exists());
    }
}
