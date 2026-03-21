package com.kavach.screenshots.repository;

import com.kavach.screenshots.entity.ScreenshotSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ScreenshotSettingsRepository extends JpaRepository<ScreenshotSettings, UUID> {
}
