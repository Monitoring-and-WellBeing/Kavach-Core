package com.kavach.rewards.service;

import com.kavach.alerts.entity.Alert;
import com.kavach.alerts.repository.AlertRepository;
import com.kavach.gamification.repository.StudentBadgeRepository;
import com.kavach.rewards.dto.*;
import com.kavach.rewards.entity.Reward;
import com.kavach.rewards.entity.RedemptionStatus;
import com.kavach.rewards.entity.RewardCategory;
import com.kavach.rewards.entity.RewardRedemption;
import com.kavach.rewards.repository.RedemptionRepository;
import com.kavach.rewards.repository.RewardRepository;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepo;
    private final RedemptionRepository redemptionRepo;
    private final StudentBadgeRepository studentBadgeRepo;
    private final UserRepository userRepo;
    private final AlertRepository alertRepo;

    // ── Parent: list all rewards ──────────────────────────────────────────────
    public List<RewardDto> getRewardsForTenant(UUID tenantId) {
        return rewardRepo.findByTenantIdOrderByCreatedAtDesc(tenantId)
            .stream().map(this::toRewardDto).toList();
    }

    // ── Parent / Student: list active rewards ─────────────────────────────────
    public List<RewardDto> getActiveRewardsForTenant(UUID tenantId) {
        return rewardRepo.findByTenantIdAndActiveTrueOrderByXpCostAsc(tenantId)
            .stream().map(this::toRewardDto).toList();
    }

    // ── Parent: create reward ─────────────────────────────────────────────────
    @Transactional
    public RewardDto create(CreateRewardDto dto, UUID tenantId, UUID createdBy) {
        RewardCategory cat;
        try {
            cat = RewardCategory.valueOf(dto.getCategory() != null ? dto.getCategory() : "CUSTOM");
        } catch (IllegalArgumentException e) {
            cat = RewardCategory.CUSTOM;
        }
        Reward reward = Reward.builder()
            .tenantId(tenantId)
            .title(dto.getTitle())
            .description(dto.getDescription())
            .category(cat)
            .xpCost(dto.getXpCost())
            .icon(dto.getIcon() != null ? dto.getIcon() : "🎁")
            .active(true)
            .createdBy(createdBy)
            .build();
        return toRewardDto(rewardRepo.save(reward));
    }

    // ── Parent: toggle active/inactive ────────────────────────────────────────
    @Transactional
    public RewardDto toggle(UUID rewardId, UUID tenantId) {
        Reward reward = rewardRepo.findByIdAndTenantId(rewardId, tenantId)
            .orElseThrow(() -> new NoSuchElementException("Reward not found"));
        reward.setActive(!reward.isActive());
        return toRewardDto(rewardRepo.save(reward));
    }

    // ── Student: redeem a reward ──────────────────────────────────────────────
    @Transactional
    public RedemptionDto redeem(UUID rewardId, RedeemRequestDto dto,
                                UUID studentId, UUID tenantId) {
        Reward reward = rewardRepo.findByIdAndTenantId(rewardId, tenantId)
            .orElseThrow(() -> new NoSuchElementException("Reward not found"));

        if (!reward.isActive()) {
            throw new IllegalArgumentException("Reward is not currently available");
        }

        UUID deviceId = dto.getDeviceId();
        if (deviceId == null) {
            throw new IllegalArgumentException("deviceId is required");
        }

        // Available XP = earned from badges - already spent
        long earned = studentBadgeRepo.totalXpByDevice(deviceId);
        long spent  = redemptionRepo.totalXpSpentByDevice(deviceId);
        long available = earned - spent;

        if (available < reward.getXpCost()) {
            throw new IllegalArgumentException(
                "Not enough XP. Need " + reward.getXpCost() + " XP, have " + available);
        }

        RewardRedemption redemption = RewardRedemption.builder()
            .rewardId(rewardId)
            .deviceId(deviceId)
            .tenantId(tenantId)
            .studentUserId(studentId)
            .xpSpent(reward.getXpCost())
            .status(RedemptionStatus.PENDING)
            .studentNote(dto.getNote())
            .build();

        redemption = redemptionRepo.save(redemption);

        // Alert parent
        alertRepo.save(Alert.builder()
            .tenantId(tenantId)
            .ruleType("REWARD_REQUESTED")
            .severity("INFO")
            .title("Reward request: " + reward.getTitle())
            .message(getStudentName(studentId) + " has requested: " + reward.getTitle()
                + " (" + reward.getXpCost() + " XP)")
            .build());

        return toDto(redemption, reward, getStudentName(studentId));
    }

    // ── Parent: get pending redemption requests ────────────────────────────────
    public List<RedemptionDto> getPendingRedemptions(UUID tenantId) {
        return redemptionRepo
            .findByTenantIdAndStatusOrderByRequestedAtDesc(tenantId, RedemptionStatus.PENDING)
            .stream()
            .map(r -> {
                Reward rw = rewardRepo.findById(r.getRewardId()).orElse(null);
                return toDto(r, rw, getStudentName(r.getStudentUserId()));
            })
            .toList();
    }

    // ── Parent: approve or deny a redemption ──────────────────────────────────
    @Transactional
    public RedemptionDto resolve(UUID redemptionId, ResolveRedemptionDto dto, UUID tenantId) {
        RewardRedemption r = redemptionRepo.findByIdAndTenantId(redemptionId, tenantId)
            .orElseThrow(() -> new NoSuchElementException("Redemption not found"));

        if (r.getStatus() != RedemptionStatus.PENDING) {
            throw new IllegalArgumentException("Redemption is no longer pending");
        }

        RedemptionStatus newStatus;
        try {
            newStatus = RedemptionStatus.valueOf(dto.getStatus());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Status must be APPROVED or DENIED");
        }

        if (newStatus != RedemptionStatus.APPROVED && newStatus != RedemptionStatus.DENIED) {
            throw new IllegalArgumentException("Status must be APPROVED or DENIED");
        }

        r.setStatus(newStatus);
        r.setParentNote(dto.getParentNote());
        r.setResolvedAt(OffsetDateTime.now());

        redemptionRepo.save(r);

        Reward reward = rewardRepo.findById(r.getRewardId()).orElse(null);
        String rewardTitle = reward != null ? reward.getTitle() : "Reward";

        // Alert student (via INFO alert)
        String statusVerb = newStatus == RedemptionStatus.APPROVED ? "approved" : "denied";
        alertRepo.save(Alert.builder()
            .tenantId(tenantId)
            .ruleType("REWARD_" + newStatus.name())
            .severity("INFO")
            .title("Reward " + statusVerb + ": " + rewardTitle)
            .message("Your request for \"" + rewardTitle + "\" has been " + statusVerb + ".")
            .build());

        return toDto(r, reward, getStudentName(r.getStudentUserId()));
    }

    // ── Parent: mark as fulfilled ─────────────────────────────────────────────
    @Transactional
    public RedemptionDto fulfill(UUID redemptionId, UUID tenantId) {
        RewardRedemption r = redemptionRepo.findByIdAndTenantId(redemptionId, tenantId)
            .orElseThrow(() -> new NoSuchElementException("Redemption not found"));

        if (r.getStatus() != RedemptionStatus.APPROVED) {
            throw new IllegalArgumentException("Can only fulfill an approved redemption");
        }

        r.setStatus(RedemptionStatus.FULFILLED);
        r.setFulfilledAt(OffsetDateTime.now());
        redemptionRepo.save(r);

        Reward reward = rewardRepo.findById(r.getRewardId()).orElse(null);
        return toDto(r, reward, getStudentName(r.getStudentUserId()));
    }

    // ── Student: my redemption history ────────────────────────────────────────
    public List<RedemptionDto> getRedemptionsForStudent(UUID studentId) {
        return redemptionRepo.findByStudentUserIdOrderByRequestedAtDesc(studentId)
            .stream()
            .map(r -> {
                Reward rw = rewardRepo.findById(r.getRewardId()).orElse(null);
                return toDto(r, rw, null);
            })
            .toList();
    }

    // ── Available XP for a device ──────────────────────────────────────────────
    public long getAvailableXp(UUID deviceId) {
        long earned = studentBadgeRepo.totalXpByDevice(deviceId);
        long spent  = redemptionRepo.totalXpSpentByDevice(deviceId);
        return Math.max(0, earned - spent);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    private RewardDto toRewardDto(Reward r) {
        return RewardDto.builder()
            .id(r.getId())
            .title(r.getTitle())
            .description(r.getDescription())
            .category(r.getCategory().name())
            .xpCost(r.getXpCost())
            .icon(r.getIcon())
            .active(r.isActive())
            .createdAt(r.getCreatedAt())
            .build();
    }

    private RedemptionDto toDto(RewardRedemption r, Reward reward, String studentName) {
        return RedemptionDto.builder()
            .id(r.getId())
            .rewardId(r.getRewardId())
            .reward(reward != null ? toRewardDto(reward) : null)
            .studentUserId(r.getStudentUserId())
            .studentName(studentName)
            .xpSpent(r.getXpSpent())
            .status(r.getStatus().name())
            .studentNote(r.getStudentNote())
            .parentNote(r.getParentNote())
            .requestedAt(r.getRequestedAt())
            .requestedAtRelative(formatRelative(r.getRequestedAt()))
            .resolvedAt(r.getResolvedAt())
            .fulfilledAt(r.getFulfilledAt())
            .build();
    }

    private String getStudentName(UUID userId) {
        if (userId == null) return "Student";
        return userRepo.findById(userId).map(User::getName).orElse("Student");
    }

    private String formatRelative(OffsetDateTime time) {
        if (time == null) return "";
        long mins = ChronoUnit.MINUTES.between(time, OffsetDateTime.now());
        if (mins < 1) return "Just now";
        if (mins < 60) return mins + "m ago";
        long hours = ChronoUnit.HOURS.between(time, OffsetDateTime.now());
        if (hours < 24) return hours + "h ago";
        return ChronoUnit.DAYS.between(time, OffsetDateTime.now()) + "d ago";
    }
}
