package com.kavach.subscription;

import com.kavach.devices.entity.Device;
import com.kavach.devices.repository.DeviceRepository;
import com.kavach.subscription.dto.PlanDto;
import com.kavach.subscription.dto.SubscriptionDto;
import com.kavach.subscription.entity.Plan;
import com.kavach.subscription.entity.Subscription;
import com.kavach.subscription.repository.PaymentOrderRepository;
import com.kavach.subscription.repository.PlanRepository;
import com.kavach.subscription.repository.SubscriptionRepository;
import com.kavach.subscription.service.SubscriptionService;
import com.razorpay.RazorpayClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 14 — Subscription Service")
class SubscriptionServiceTest {

    @Mock SubscriptionRepository subRepo;
    @Mock PlanRepository planRepo;
    @Mock PaymentOrderRepository paymentOrderRepo;
    @Mock DeviceRepository deviceRepo;
    @Mock RazorpayClient razorpayClient;
    @InjectMocks SubscriptionService subscriptionService;

    private UUID tenantId;
    private Plan standardPlan;
    private Subscription subscription;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");

        standardPlan = new Plan();
        standardPlan.setId(UUID.randomUUID());
        standardPlan.setCode("STANDARD");
        standardPlan.setName("Standard");
        standardPlan.setPlanType("B2C");
        standardPlan.setPriceFlat(29900);
        standardPlan.setMaxDevices(4);
        standardPlan.setFeatures(new String[]{"device_monitoring", "ai_insights"});
        standardPlan.setActive(true);

        subscription = new Subscription();
        subscription.setId(UUID.randomUUID());
        subscription.setTenantId(tenantId);
        subscription.setPlanId(standardPlan.getId());
        subscription.setStatus("TRIAL");
        subscription.setDeviceCount(2);
        subscription.setCurrentPeriodEnd(LocalDateTime.now().plusDays(28));
        subscription.setTrialEndsAt(LocalDateTime.now().plusDays(28));
    }

    @Test
    @DisplayName("getCurrentSubscription() returns correct plan details")
    void getCurrentSubscription_returnsCorrectPlan() {
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(subscription.getPlanId())).thenReturn(Optional.of(standardPlan));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of());

        SubscriptionDto result = subscriptionService.getCurrentSubscription(tenantId);

        assertThat(result.getPlanCode()).isEqualTo("STANDARD");
        assertThat(result.getStatus()).isEqualTo("TRIAL");
        assertThat(result.isTrial()).isTrue();
    }

    @Test
    @DisplayName("getCurrentSubscription() calculates device usage percent")
    void getCurrentSubscription_calculatesUsagePercent() {
        subscription.setDeviceCount(2);
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of());

        SubscriptionDto result = subscriptionService.getCurrentSubscription(tenantId);

        assertThat(result.getDeviceUsagePercent()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("canAddDevice() returns true when under limit")
    void canAddDevice_returnsTrueWhenUnderLimit() {
        subscription.setDeviceCount(2); // 2 of 4
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));

        boolean result = subscriptionService.canAddDevice(tenantId);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("canAddDevice() returns false when at limit")
    void canAddDevice_returnsFalseWhenAtLimit() {
        subscription.setDeviceCount(4); // at limit
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));

        boolean result = subscriptionService.canAddDevice(tenantId);

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("canAddDevice() returns true for unlimited plan (INSTITUTE)")
    void canAddDevice_returnsTrueForUnlimitedPlan() {
        standardPlan.setMaxDevices(-1); // unlimited
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));

        boolean result = subscriptionService.canAddDevice(tenantId);

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("getPlansForType() returns plans ordered by price")
    void getPlansForType_returnsOrderedPlans() {
        Plan basicPlan = new Plan();
        basicPlan.setId(UUID.randomUUID());
        basicPlan.setCode("BASIC");
        basicPlan.setPriceFlat(14900);
        basicPlan.setMaxDevices(3);
        basicPlan.setFeatures(new String[]{});
        basicPlan.setPlanType("B2C");
        basicPlan.setActive(true);

        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));
        when(planRepo.findByPlanTypeAndActiveTrueOrderByPriceFlatAsc("B2C"))
            .thenReturn(List.of(basicPlan, standardPlan));

        var plans = subscriptionService.getPlansForType(tenantId, "B2C");

        assertThat(plans).hasSize(2);
        assertThat(plans.get(0).getCode()).isEqualTo("BASIC");
        assertThat(plans.get(0).getPriceFormatted()).contains("149");
    }

    @Test
    @DisplayName("monthlyTotalFormatted formats paise to rupees correctly")
    void monthlyTotalFormatted_formatsPaiseToRupees() {
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of());

        SubscriptionDto result = subscriptionService.getCurrentSubscription(tenantId);

        assertThat(result.getMonthlyTotalFormatted()).contains("299");
        assertThat(result.getMonthlyTotalFormatted()).contains("/month");
    }

    @Test
    @DisplayName("nearLimit is true at 80%+ usage")
    void nearLimit_trueAt80PercentUsage() {
        subscription.setDeviceCount(4); // 4 of 4 = 100%
        when(subRepo.findByTenantId(tenantId)).thenReturn(Optional.of(subscription));
        when(planRepo.findById(any())).thenReturn(Optional.of(standardPlan));
        // Mock deviceRepo to return 4 devices
        Device d1 = Device.builder().id(UUID.randomUUID()).build();
        Device d2 = Device.builder().id(UUID.randomUUID()).build();
        Device d3 = Device.builder().id(UUID.randomUUID()).build();
        Device d4 = Device.builder().id(UUID.randomUUID()).build();
        when(deviceRepo.findByTenantIdAndActiveTrue(tenantId)).thenReturn(List.of(d1, d2, d3, d4));

        SubscriptionDto result = subscriptionService.getCurrentSubscription(tenantId);

        assertThat(result.isNearLimit()).isTrue();
        assertThat(result.isAtLimit()).isTrue();
    }
}
