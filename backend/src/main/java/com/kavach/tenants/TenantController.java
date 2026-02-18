package com.kavach.tenants;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Tenant> create(@RequestBody Tenant tenant) {
        return ResponseEntity.ok(tenantService.create(tenant));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Tenant>> getAll() {
        return ResponseEntity.ok(tenantService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(tenantService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public ResponseEntity<Tenant> update(@PathVariable UUID id, @RequestBody Tenant updates) {
        return ResponseEntity.ok(tenantService.update(id, updates));
    }
}
