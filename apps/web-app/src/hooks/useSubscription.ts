import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi, Subscription, Plan } from "@/lib/subscription";
import { subscriptionQueryApi } from "@/lib/api/subscriptionApi";

export function useSubscription() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionQueryApi.get,
    staleTime: 5 * 60 * 1000,
    // GAP-16 FIXED
  });

  const upgradeMutation = useMutation({
    mutationFn: (planCode: string) => subscriptionApi.createOrder(planCode),
  });

  const verifyMutation = useMutation({
    mutationFn: (data: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      planCode: string;
    }) => subscriptionApi.verifyPayment(data),
    onSuccess: (updated) => {
      queryClient.setQueryData<{ subscription: Subscription; plans: Plan[] }>(
        ["subscription"],
        (prev) => ({
          subscription: updated,
          plans: prev?.plans ?? [],
        })
      );
    },
  });

  const onPaymentSuccess = async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    planCode: string;
  }) => verifyMutation.mutateAsync(data);

  const subscription = query.data?.subscription ?? null;
  const plans = query.data?.plans ?? [];

  // Derived usage values for backwards-compat
  const usage = subscription
    ? {
        devices: subscription.deviceCount,
        maxDevices: subscription.maxDevices,
        usagePercent: subscription.deviceUsagePercent,
        nearLimit: subscription.nearLimit,
        atLimit: subscription.atLimit,
      }
    : null;

  return {
    subscription,
    plans,
    usage,
    loading: query.isLoading,
    upgrading: upgradeMutation.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    upgradePlan: (planCode: string) => upgradeMutation.mutateAsync(planCode),
    onPaymentSuccess,
    refetch: () => { void query.refetch(); },
  };
}
