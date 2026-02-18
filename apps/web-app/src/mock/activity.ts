import { AppUsageLog, AppCategory } from "@kavach/shared-types";

export const mockAppUsage: AppUsageLog[] = [
  { id: "log-001", deviceId: "dev-001", appName: "Google Chrome", appPath: "chrome.exe", category: AppCategory.PRODUCTIVITY, durationMinutes: 120, timestamp: new Date().toISOString(), isBlocked: false },
  { id: "log-002", deviceId: "dev-001", appName: "Free Fire", appPath: "freefire.exe", category: AppCategory.GAMING, durationMinutes: 45, timestamp: new Date().toISOString(), isBlocked: true },
  { id: "log-003", deviceId: "dev-001", appName: "Instagram", appPath: "instagram.exe", category: AppCategory.SOCIAL_MEDIA, durationMinutes: 30, timestamp: new Date().toISOString(), isBlocked: true },
  { id: "log-004", deviceId: "dev-001", appName: "VS Code", appPath: "code.exe", category: AppCategory.EDUCATION, durationMinutes: 90, timestamp: new Date().toISOString(), isBlocked: false },
  { id: "log-005", deviceId: "dev-001", appName: "YouTube", appPath: "youtube.com", category: AppCategory.ENTERTAINMENT, durationMinutes: 60, timestamp: new Date().toISOString(), isBlocked: false },
  { id: "log-006", deviceId: "dev-002", appName: "Microsoft Word", appPath: "winword.exe", category: AppCategory.PRODUCTIVITY, durationMinutes: 150, timestamp: new Date().toISOString(), isBlocked: false },
  { id: "log-007", deviceId: "dev-002", appName: "PUBG", appPath: "pubg.exe", category: AppCategory.GAMING, durationMinutes: 20, timestamp: new Date().toISOString(), isBlocked: true },
];

export const mockWeeklyData = [
  { day: "Mon", screenTime: 180, education: 90, gaming: 30, social: 20, other: 40 },
  { day: "Tue", screenTime: 220, education: 110, gaming: 45, social: 35, other: 30 },
  { day: "Wed", screenTime: 150, education: 80, gaming: 10, social: 15, other: 45 },
  { day: "Thu", screenTime: 290, education: 120, gaming: 80, social: 50, other: 40 },
  { day: "Fri", screenTime: 200, education: 100, gaming: 40, social: 30, other: 30 },
  { day: "Sat", screenTime: 350, education: 60, gaming: 150, social: 90, other: 50 },
  { day: "Sun", screenTime: 310, education: 40, gaming: 140, social: 80, other: 50 },
];

export const mockCategoryBreakdown = [
  { name: "Education", value: 35, color: "#3b82f6" },
  { name: "Gaming", value: 22, color: "#ef4444" },
  { name: "Entertainment", value: 18, color: "#f59e0b" },
  { name: "Social Media", value: 14, color: "#8b5cf6" },
  { name: "Productivity", value: 8, color: "#22c55e" },
  { name: "Other", value: 3, color: "#6b7280" },
];
