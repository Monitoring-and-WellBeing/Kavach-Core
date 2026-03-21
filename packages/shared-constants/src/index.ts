import { AppCategory, PlanType } from "@kavach/shared-types";

export const APP_CATEGORIES: Record<AppCategory, string> = {
  EDUCATION: "Education",
  SOCIAL_MEDIA: "Social Media",
  GAMING: "Gaming",
  ENTERTAINMENT: "Entertainment",
  PRODUCTIVITY: "Productivity",
  COMMUNICATION: "Communication",
  NEWS: "News",
  OTHER: "Other",
};

export const BLOCKED_CATEGORIES_DEFAULT: AppCategory[] = [
  AppCategory.GAMING,
  AppCategory.SOCIAL_MEDIA,
  AppCategory.ENTERTAINMENT,
];

export const PLAN_LIMITS: Record<
  PlanType,
  { devices: number; price: number; annualPrice: number }
> = {
  FREE_TRIAL: { devices: 5, price: 0, annualPrice: 0 },
  STARTER: { devices: 50, price: 100, annualPrice: 80 },
  INSTITUTE: { devices: 300, price: 150, annualPrice: 120 },
  ENTERPRISE: { devices: 99999, price: 0, annualPrice: 0 },
};

export const FOCUS_PRESETS = [
  { label: "25 min (Pomodoro)", value: 25 },
  { label: "50 min (Deep Work)", value: 50 },
  { label: "90 min (Flow)", value: 90 },
  { label: "Custom", value: 0 },
];

export const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const DEVICE_LINK_CODE_LENGTH = 6;
