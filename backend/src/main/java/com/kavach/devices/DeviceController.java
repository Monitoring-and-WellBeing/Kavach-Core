package com.kavach.devices;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping("/link")
    public ResponseEntity<Device> linkDevice(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String agentVersion = body.getOrDefault("agentVersion", "unknown");
        String osVersion = body.getOrDefault("osVersion", "unknown");
        return ResponseEntity.ok(deviceService.linkDevice(code, agentVersion, osVersion));
    }

    @GetMapping
    public ResponseEntity<List<Device>> getDevices(@RequestParam UUID tenantId) {
        return ResponseEntity.ok(deviceService.findByTenantId(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> getDevice(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.findById(id));
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<Device> pause(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.pause(id));
    }

    @PutMapping("/{id}/resume")
    public ResponseEntity<Device> resume(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.resume(id));
    }

    @PutMapping("/{id}/focus")
    public ResponseEntity<Device> focus(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.setFocusMode(id));
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<Device> heartbeat(@PathVariable UUID id) {
        return ResponseEntity.ok(deviceService.heartbeat(id));
    }

    @PostMapping
    public ResponseEntity<Device> create(@RequestBody Device device) {
        return ResponseEntity.ok(deviceService.create(device));
    }
}
