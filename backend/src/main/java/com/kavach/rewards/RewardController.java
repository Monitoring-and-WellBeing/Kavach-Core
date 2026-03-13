package com.kavach.rewards;

import com.kavach.rewards.dto.*;
import com.kavach.rewards.service.RewardService;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Rewards & Redemptions API
 *
 * Parent endpoints:
 *   GET  /api/v1/rewards                          — list all rewards for tenant
 *   POST /api/v1/rewards                          — create reward
 *   PATCH /api/v1/rewards/{id}/toggle             — enable/disable
 *   GET  /api/v1/rewards/redemptions/pending      — pending requests from students
 *   POST /api/v1/rewards/redemptions/{id}/resolve — approve or deny
 *   POST /api/v1/rewards/redemptions/{id}/fulfill — mark as given
 *
 * Student endpoints:
 *   GET  /api/v1/rewards/available                — active rewards to redeem
 *   POST /api/v1/rewards/{id}/redeem              — request a redemption
 *   GET  /api/v1/rewards/redemptions/mine         — student's own history
 */
@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;
    private final UserRepository userRepo;

    // ── Parent: list all rewards ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<RewardDto>> getRewards(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.getRewardsForTenant(getTenantId(email)));
    }

    // ── Parent: create reward ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<RewardDto> createReward(
            @RequestBody CreateRewardDto dto,
            @AuthenticationPrincipal String email) {
        User user = getUser(email);
        return ResponseEntity.status(201)
            .body(rewardService.create(dto, user.getTenantId(), user.getId()));
    }

    // ── Parent: toggle active/inactive ────────────────────────────────────────
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<RewardDto> toggleReward(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.toggle(id, getTenantId(email)));
    }

    // ── Student: get available rewards ────────────────────────────────────────
    @GetMapping("/available")
    public ResponseEntity<List<RewardDto>> getAvailableRewards(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.getActiveRewardsForTenant(getTenantId(email)));
    }

    // ── Student: redeem a reward ──────────────────────────────────────────────
    @PostMapping("/{id}/redeem")
    public ResponseEntity<RedemptionDto> redeemReward(
            @PathVariable UUID id,
            @RequestBody RedeemRequestDto dto,
            @AuthenticationPrincipal String email) {
        User user = getUser(email);
        return ResponseEntity.status(201)
            .body(rewardService.redeem(id, dto, user.getId(), user.getTenantId()));
    }

    // ── Parent: pending redemption requests ───────────────────────────────────
    @GetMapping("/redemptions/pending")
    public ResponseEntity<List<RedemptionDto>> getPendingRedemptions(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.getPendingRedemptions(getTenantId(email)));
    }

    // ── Parent: approve or deny ───────────────────────────────────────────────
    @PostMapping("/redemptions/{id}/resolve")
    public ResponseEntity<RedemptionDto> resolveRedemption(
            @PathVariable UUID id,
            @RequestBody ResolveRedemptionDto dto,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.resolve(id, dto, getTenantId(email)));
    }

    // ── Parent: mark as fulfilled ─────────────────────────────────────────────
    @PostMapping("/redemptions/{id}/fulfill")
    public ResponseEntity<RedemptionDto> fulfillRedemption(
            @PathVariable UUID id,
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.fulfill(id, getTenantId(email)));
    }

    // ── Student: redemption history ───────────────────────────────────────────
    @GetMapping("/redemptions/mine")
    public ResponseEntity<List<RedemptionDto>> getMyRedemptions(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rewardService.getRedemptionsForStudent(getUser(email).getId()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private User getUser(String email) {
        return userRepo.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UUID getTenantId(String email) {
        return getUser(email).getTenantId();
    }
}
