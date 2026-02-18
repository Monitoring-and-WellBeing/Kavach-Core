package com.kavach.tasks;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByStudentIdOrderByScheduledTimeAsc(UUID studentId);
    List<Task> findByStudentIdAndCompletedFalseOrderByScheduledTimeAsc(UUID studentId);
}
