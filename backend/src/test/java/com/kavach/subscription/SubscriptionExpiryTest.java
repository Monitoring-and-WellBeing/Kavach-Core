package com.kavach.subscription;

import com.kavach.subscription.entity.Plan;
import com.kavach.subscription.entity.Subscription;
import com.kavach.subscription.repository.PlanRepository;
import com.kavach.subscription.repository.SubscriptionRepository;
import com.kavach.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionExpiryTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PlanRepository planRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private UUID tenantId;
    private Subscription activeSubscription;
    private Subscription expiredSubscription;
    private Subscription trialSubscription;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        activeSubscription = new Subscription();
        activeSubscription.setId(UUID.randomUUID());
        activeSubscription.setTenantId(tenantId);
        activeSubscription.setStatus("ACTIVE");
        activeSubscription.setCurrentPeriodEnd(LocalDateTime.now().plusDays(5));

        expiredSubscription = new Subscription();
        expiredSubscription.setId(UUID.randomUUID());
        expiredSubscription.setTenantId(tenantId);
        expiredSubscription.setStatus("ACTIVE");
        expiredSubscription.setCurrentPeriodEnd(LocalDateTime.now().minusDays(1)); // Expired

        trialSubscription = new Subscription();
        trialSubscription.setId(UUID.randomUUID());
        trialSubscription.setTenantId(tenantId);
        trialSubscription.setStatus("TRIAL");
        trialSubscription.setCurrentPeriodEnd(LocalDateTime.now().minusHours(2)); // Expired
    }

    @Test
    void testExpireElapsedSubscriptions_ExpiresActiveSubscription() {
        // Given
        when(subscriptionRepository.findByStatusIn(anyList()))
                .thenReturn(Arrays.asList(expiredSubscription));
        when(subscriptionRepository.save(any(Subscription.class)))
                .thenReturn(expiredSubscription);

        // When
        subscriptionService.expireElapsedSubscriptions();

        // Then
        verify(subscriptionRepository).findByStatusIn(Arrays.asList("ACTIVE", "TRIAL"));
        verify(subscriptionRepository).save(argThat(sub -> 
                "EXPIRED".equals(sub.getStatus()) && 
                sub.getUpdatedAt() != null
        ));
    }

    @Test
    void testExpireElapsedSubscriptions_ExpiresTrialSubscription() {
        // Given
        when(subscriptionRepository.findByStatusIn(anyList()))
                .thenReturn(Arrays.asList(trialSubscription));
        when(subscriptionRepository.save(any(Subscription.class)))
                .thenReturn(trialSubscription);

        // When
        subscriptionService.expireElapsedSubscriptions();

        // Then
        verify(subscriptionRepository).save(argThat(sub -> 
                "EXPIRED".equals(sub.getStatus())
        ));
    }

    @Test
    void testExpireElapsedSubscriptions_DoesNotExpireActiveSubscriptions() {
        // Given
        when(subscriptionRepository.findByStatusIn(anyList()))
                .thenReturn(Arrays.asList(activeSubscription));

        // When
        subscriptionService.expireElapsedSubscriptions();

        // Then
        verify(subscriptionRepository, never()).save(activeSubscription);
    }

    @Test
    void testCanAddDevice_RejectsExpiredSubscription() {
        // Given
        Subscription expired = new Subscription();
        expired.setStatus("EXPIRED");
        expired.setDeviceCount(2);

        when(subscriptionRepository.findByTenantId(tenantId))
                .thenReturn(Optional.of(expired));

        // When
        boolean canAdd = subscriptionService.canAddDevice(tenantId);

        // Then
        assertFalse(canAdd);
    }

    @Test
    void testCanAddDevice_RejectsCancelledSubscription() {
        // Given
        Subscription cancelled = new Subscription();
        cancelled.setStatus("CANCELLED");
        cancelled.setDeviceCount(2);

        when(subscriptionRepository.findByTenantId(tenantId))
                .thenReturn(Optional.of(cancelled));

        // When
        boolean canAdd = subscriptionService.canAddDevice(tenantId);

        // Then
        assertFalse(canAdd);
    }

    @Test
    void testCanAddDevice_AllowsActiveSubscription() {
        // Given
        Plan plan = new Plan();
        plan.setMaxDevices(5);
        activeSubscription.setDeviceCount(2);
        activeSubscription.setPlanId(UUID.randomUUID());

        when(subscriptionRepository.findByTenantId(tenantId))
                .thenReturn(Optional.of(activeSubscription));
        when(planRepository.findById(any(UUID.class)))
                .thenReturn(Optional.of(plan));

        // When
        boolean canAdd = subscriptionService.canAddDevice(tenantId);

        // Then
        assertTrue(canAdd);
    }
}
