package com.kavach.gamification.repository;

import com.kavach.gamification.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BadgeRepository extends JpaRepository<Badge, UUID> {
    List<Badge> findByActiveTrue();
}
