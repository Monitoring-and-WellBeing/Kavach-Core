package com.kavach.tasks;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    public List<Task> getStudentTasks(UUID studentId) {
        return taskRepository.findByStudentIdOrderByScheduledTimeAsc(studentId);
    }

    public Task createTask(Task task) {
        task.setCreatedAt(Instant.now());
        return taskRepository.save(task);
    }

    public Task completeTask(UUID taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setCompleted(true);
        task.setCompletedAt(Instant.now());
        return taskRepository.save(task);
    }

    public void deleteTask(UUID taskId) {
        taskRepository.deleteById(taskId);
    }
}
