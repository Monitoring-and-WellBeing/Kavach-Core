package com.kavach.goals;

import com.kavach.goals.dto.CreateGoalRequest;
import com.kavach.goals.dto.GoalDto;
import com.kavach.goals.service.GoalService;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalsController {

    private final GoalService goalService;
    private final UserRepository userRepo;

    @GetMapping("/device/{deviceId}")
    public ResponseEntity<List<GoalDto>> getDeviceGoals(@PathVariable UUID deviceId) {
        return ResponseEntity.ok(goalService.getGoalsForDevice(deviceId));
    }

    @GetMapping
    public ResponseEntity<List<GoalDto>> getAllGoals(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(goalService.getGoalsForTenant(getTenantId(email)));
    }

    @PostMapping
    public ResponseEntity<GoalDto> createGoal(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody CreateGoalRequest req) {
        User user = userRepo.findByEmail(email).orElseThrow();
        return ResponseEntity.status(201)
            .body(goalService.createGoal(user.getTenantId(), user.getId(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @AuthenticationPrincipal String email, @PathVariable UUID id) {
        goalService.deleteGoal(id, getTenantId(email));
        return ResponseEntity.noContent().build();
    }

    private UUID getTenantId(String email) {
        return userRepo.findByEmail(email)
            .map(User::getTenantId)
            .orElseThrow();
    }
}
