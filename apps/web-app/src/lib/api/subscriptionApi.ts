import { subscriptionApi, type Plan, type Subscription } from "@/lib/subscription";

export interface SubscriptionBundle {
  subscription: Subscription;
  plans: Plan[];
}

export const subscriptionQueryApi = {
  async get(): Promise<SubscriptionBundle> {
    const [subscription, plans] = await Promise.all([
      subscriptionApi.getCurrent(),
      subscriptionApi.getPlans().catch(() => [] as Plan[]),
    ]);
    return { subscription, plans };
  },
};
