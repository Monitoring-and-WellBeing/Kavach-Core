package com.kavach.focus.repository;

import com.kavach.focus.entity.FocusWhitelist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FocusWhitelistRepository extends JpaRepository<FocusWhitelist, UUID> {
    List<FocusWhitelist> findByTenantId(UUID tenantId);
    Optional<FocusWhitelist> findByTenantIdAndProcessName(UUID tenantId, String processName);
    void deleteByTenantIdAndProcessName(UUID tenantId, String processName);
}
