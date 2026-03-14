package com.kavach.location.repository;

import com.kavach.location.entity.MobileAppUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MobileAppUsageRepository extends JpaRepository<MobileAppUsage, UUID> {
}
