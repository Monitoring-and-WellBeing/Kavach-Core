package com.kavach.goals.repository;

import com.kavach.goals.entity.GoalProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalProgressRepository extends JpaRepository<GoalProgress, UUID> {
    Optional<GoalProgress> findByGoalIdAndPeriodDate(UUID goalId, LocalDate date);
    List<GoalProgress> findByGoalIdAndPeriodDateBetweenOrderByPeriodDateAsc(
        UUID goalId, LocalDate from, LocalDate to);
}
