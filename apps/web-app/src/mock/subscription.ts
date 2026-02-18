import { Subscription, PlanType } from "@kavach/shared-types";

export const mockSubscription: Subscription = {
  id: "sub-001",
  tenantId: "tenant-001",
  plan: PlanType.INSTITUTE,
  deviceLimit: 300,
  pricePerDevice: 150,
  billingCycle: "MONTHLY",
  startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
  endDate: new Date(Date.now() + 86400000 * 335).toISOString(),
  status: "ACTIVE",
};

export const mockUsage = {
  devicesUsed: 48,
  deviceLimit: 300,
  percentUsed: 16,
};
