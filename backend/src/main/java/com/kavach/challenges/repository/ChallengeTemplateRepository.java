package com.kavach.challenges.repository;

import com.kavach.challenges.entity.ChallengeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChallengeTemplateRepository extends JpaRepository<ChallengeTemplate, UUID> {
    List<ChallengeTemplate> findByActiveTrue();
}
