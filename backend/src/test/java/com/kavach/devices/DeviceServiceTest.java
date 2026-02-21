package com.kavach.devices;

import com.kavach.devices.dto.DeviceDto;
import com.kavach.devices.dto.LinkDeviceRequest;
import com.kavach.devices.entity.*;
import com.kavach.devices.repository.*;
import com.kavach.devices.service.DeviceService;
import com.kavach.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 02 — Device Service")
class DeviceServiceTest {

    @Mock DeviceRepository deviceRepo;
    @Mock DeviceLinkCodeRepository codeRepo;
    @Mock SubscriptionService subscriptionService;
    @InjectMocks DeviceService deviceService;

    private UUID tenantId;
    private Device mockDevice;
    private DeviceLinkCode mockLinkCode;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        mockDevice = Device.builder()
            .id(UUID.randomUUID())
            .name("Arjun's Laptop")
            .tenantId(tenantId)
            .type(DeviceType.DESKTOP)
            .status(DeviceStatus.ONLINE)
            .active(true)
            .build();

        mockLinkCode = DeviceLinkCode.builder()
            .code("ABC123")
            .expiresAt(LocalDateTime.now().plusMinutes(15))
            .used(false)
            .build();
    }

    @Test
    @DisplayName("getDevicesByTenant() returns all active devices for tenant")
    void getDevicesByTenant_returnsTenantDevices() {
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId))
            .thenReturn(List.of(mockDevice));

        List<DeviceDto> result = deviceService.getDevicesByTenant(tenantId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Arjun's Laptop");
        verify(deviceRepo).findByTenantIdAndActiveTrue(tenantId);
    }

    @Test
    @DisplayName("pauseDevice() sets status to PAUSED")
    void pauseDevice_setsStatusToPaused() {
        when(deviceRepo.findById(any())).thenReturn(Optional.of(mockDevice));
        when(deviceRepo.save(any())).thenReturn(mockDevice);

        DeviceDto result = deviceService.pauseDevice(mockDevice.getId(), tenantId);

        assertThat(result.getStatus()).isEqualTo("PAUSED");
        verify(deviceRepo).save(any(Device.class));
    }

    @Test
    @DisplayName("resumeDevice() sets status to ONLINE")
    void resumeDevice_setsStatusToOnline() {
        mockDevice.setStatus(DeviceStatus.PAUSED);
        when(deviceRepo.findById(any())).thenReturn(Optional.of(mockDevice));
        when(deviceRepo.save(any())).thenReturn(mockDevice);

        DeviceDto result = deviceService.resumeDevice(mockDevice.getId(), tenantId);

        assertThat(result.getStatus()).isEqualTo("ONLINE");
    }

    @Test
    @DisplayName("linkDevice() throws 403 when device limit reached")
    void linkDevice_throwsWhenAtLimit() {
        when(subscriptionService.canAddDevice(tenantId)).thenReturn(false);

        LinkDeviceRequest req = new LinkDeviceRequest();
        req.setCode("ABC123");
        req.setDeviceName("New Device");

        assertThatThrownBy(() ->
            deviceService.linkDevice(tenantId, req)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Device limit reached");
    }

    @Test
    @DisplayName("linkDevice() saves device when under limit")
    void linkDevice_savesDeviceWhenUnderLimit() {
        when(subscriptionService.canAddDevice(tenantId)).thenReturn(true);
        when(codeRepo.findByCodeAndUsedFalse("ABC123")).thenReturn(Optional.of(mockLinkCode));
        when(deviceRepo.save(any())).thenReturn(mockDevice);
        when(codeRepo.save(any())).thenReturn(mockLinkCode);

        LinkDeviceRequest req = new LinkDeviceRequest();
        req.setCode("ABC123");
        req.setDeviceName("Test Device");

        DeviceDto result = deviceService.linkDevice(tenantId, req);

        assertThat(result).isNotNull();
        verify(deviceRepo).save(any());
        verify(codeRepo).save(any());
    }
}
