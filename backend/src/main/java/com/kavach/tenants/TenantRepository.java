package com.kavach.tenants;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    boolean existsByAdminEmail(String adminEmail);
    Optional<Tenant> findByAdminEmail(String email);
}
