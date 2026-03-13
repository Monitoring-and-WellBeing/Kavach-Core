package com.kavach.location.repository;

import com.kavach.location.entity.GeoFenceEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GeoFenceEventRepository extends JpaRepository<GeoFenceEvent, UUID> {
}
