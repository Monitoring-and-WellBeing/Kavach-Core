// ─── ROLES ───────────────────────────────────────────────────────────────────
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",         // Kavach internal
  INSTITUTE_ADMIN = "INSTITUTE_ADMIN", // School/coaching owner
  IT_HEAD = "IT_HEAD",                 // Lab incharge
  PRINCIPAL = "PRINCIPAL",             // View-only institute
  PARENT = "PARENT",                   // Parent of a student
  STUDENT = "STUDENT",                 // Student (limited dashboard)
}

// ─── DEVICE ──────────────────────────────────────────────────────────────────
export enum DeviceStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  PAUSED = "PAUSED",
  FOCUS_MODE = "FOCUS_MODE",
}

export enum DeviceType {
  DESKTOP = "DESKTOP",
  LAPTOP = "LAPTOP",
  TABLET = "TABLET",
  MOBILE = "MOBILE",
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  osVersion: string;
  agentVersion: string;
  lastSeen: string; // ISO date
  screenTimeToday: number; // minutes
  assignedTo?: string; // student name or device label
  tenantId: string;
  deviceCode: string; // 6-char linking code
}

// ─── ACTIVITY ────────────────────────────────────────────────────────────────
export enum AppCategory {
  EDUCATION = "EDUCATION",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  GAMING = "GAMING",
  ENTERTAINMENT = "ENTERTAINMENT",
  PRODUCTIVITY = "PRODUCTIVITY",
  COMMUNICATION = "COMMUNICATION",
  NEWS = "NEWS",
  OTHER = "OTHER",
}

export interface AppUsageLog {
  id: string;
  deviceId: string;
  appName: string;
  appPath: string;
  category: AppCategory;
  durationMinutes: number;
  timestamp: string;
  isBlocked: boolean;
}

export interface WebsiteLog {
  id: string;
  deviceId: string;
  url: string;
  domain: string;
  category: AppCategory;
  durationMinutes: number;
  timestamp: string;
  isBlocked: boolean;
}

// ─── RULES ───────────────────────────────────────────────────────────────────
export enum RuleType {
  APP_LIMIT = "APP_LIMIT",
  SCHEDULE_BLOCK = "SCHEDULE_BLOCK",
  CATEGORY_BLOCK = "CATEGORY_BLOCK",
  WEBSITE_BLOCK = "WEBSITE_BLOCK",
  FOCUS_MODE = "FOCUS_MODE",
}

export enum RuleStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  SCHEDULED = "SCHEDULED",
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  status: RuleStatus;
  deviceId?: string;
  tenantId: string;
  target: string; // app name, URL, or category
  limitMinutes?: number;
  scheduleStart?: string; // "HH:mm"
  scheduleEnd?: string;
  scheduleDays?: string[]; // ["MON","TUE"]
  autoBlock: boolean;
  createdAt: string;
}

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export enum AlertType {
  USAGE_SPIKE = "USAGE_SPIKE",
  LATE_NIGHT = "LATE_NIGHT",
  BLOCKED_ATTEMPT = "BLOCKED_ATTEMPT",
  RULE_TRIGGERED = "RULE_TRIGGERED",
  LIMIT_REACHED = "LIMIT_REACHED",
  UNUSUAL_ACTIVITY = "UNUSUAL_ACTIVITY",
  FOCUS_ENDED = "FOCUS_ENDED",
}

export enum AlertSeverity {
  LOW = "LOW",
  MODERATE = "MODERATE",
  HIGH = "HIGH",
}

export interface Alert {
  id: string;
  deviceId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  read: boolean;
  autoBlocked: boolean;
}

// ─── FOCUS MODE ──────────────────────────────────────────────────────────────
export interface FocusSession {
  id: string;
  deviceId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  allowedApps: string[];
  blockedApps: string[];
  status: "ACTIVE" | "ENDED" | "INTERRUPTED";
  initiatedBy: Role;
}

// ─── SUBSCRIPTION ────────────────────────────────────────────────────────────
export enum PlanType {
  FREE_TRIAL = "FREE_TRIAL",
  STARTER = "STARTER",
  INSTITUTE = "INSTITUTE",
  ENTERPRISE = "ENTERPRISE",
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: PlanType;
  deviceLimit: number;
  pricePerDevice: number; // INR
  billingCycle: "MONTHLY" | "ANNUAL";
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "TRIAL";
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  tenantId: string;
  avatar?: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  age: number;
  grade: string;
  parentId: string;
  deviceIds: string[];
  focusScore: number; // 0-100
  streak: number; // days
  riskLevel: AlertSeverity;
}

// ─── TENANT (Institute) ──────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  type: "SCHOOL" | "COACHING" | "TRAINING" | "CORPORATE";
  city: string;
  state: string;
  adminEmail: string;
  totalDevices: number;
  activeDevices: number;
  subscription: Subscription;
  localServerEnabled: boolean;
  createdAt: string;
}

// ─── AI INSIGHTS ─────────────────────────────────────────────────────────────
export interface AIInsight {
  id: string;
  deviceId: string;
  type: "SPIKE" | "LATE_NIGHT" | "UNUSUAL" | "WEEKEND_OVERUSE" | "RECOMMENDATION";
  title: string;
  description: string;
  riskLevel: AlertSeverity;
  generatedAt: string;
  actionSuggested?: string;
}

// ─── ACHIEVEMENTS (Student) ──────────────────────────────────────────────────
export enum BadgeType {
  FOCUS_STREAK = "FOCUS_STREAK",
  REDUCED_SCREEN_TIME = "REDUCED_SCREEN_TIME",
  HEALTHY_SLEEP = "HEALTHY_SLEEP",
  CONTROLLED_USAGE = "CONTROLLED_USAGE",
  SEVEN_DAY_STREAK = "SEVEN_DAY_STREAK",
}

export interface Badge {
  id: string;
  type: BadgeType;
  label: string;
  description: string;
  earnedAt: string;
  icon: string;
}
