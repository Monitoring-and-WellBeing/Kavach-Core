package com.kavach.tenants;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public Tenant create(Tenant tenant) {
        tenant.setCreatedAt(Instant.now());
        return tenantRepository.save(tenant);
    }

    public Tenant findById(UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
    }

    public List<Tenant> findAll() {
        return tenantRepository.findAll();
    }

    public Tenant update(UUID id, Tenant updates) {
        Tenant tenant = findById(id);
        if (updates.getName() != null) tenant.setName(updates.getName());
        if (updates.getCity() != null) tenant.setCity(updates.getCity());
        if (updates.getState() != null) tenant.setState(updates.getState());
        return tenantRepository.save(tenant);
    }
}
