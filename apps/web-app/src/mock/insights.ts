import { AIInsight, AlertSeverity } from "@kavach/shared-types";

export const mockInsights: AIInsight[] = [
  {
    id: "insight-001",
    deviceId: "dev-001",
    type: "LATE_NIGHT",
    title: "Late Night Usage Detected",
    description:
      "Rahul Sharma has been active on this device after 11 PM for 4 consecutive nights. This pattern may affect sleep and academic performance.",
    riskLevel: AlertSeverity.HIGH,
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    actionSuggested: "Consider setting a device curfew at 10 PM on weeknights.",
  },
  {
    id: "insight-002",
    deviceId: "dev-005",
    type: "SPIKE",
    title: "Weekend Screen Time Spike",
    description:
      "Screen time on weekends is 2.3x higher than weekdays (6.2 hrs vs 2.7 hrs avg). Gaming accounts for 68% of weekend usage.",
    riskLevel: AlertSeverity.MODERATE,
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    actionSuggested: "Set a weekend gaming limit of 2 hours per day.",
  },
  {
    id: "insight-003",
    deviceId: "dev-002",
    type: "RECOMMENDATION",
    title: "Focus Pattern Improving",
    description:
      "Priya Verma's education app usage increased by 40% this week. Social media attempts have dropped by 60% since rules were applied.",
    riskLevel: AlertSeverity.LOW,
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
    actionSuggested: "Positive trend! Consider rewarding with a small allowance increase.",
  },
  {
    id: "insight-004",
    deviceId: "dev-003",
    type: "UNUSUAL",
    title: "Unusual Browsing Pattern",
    description:
      "15 new domains visited in a single session yesterday — significantly above the 3-day average of 4 domains/session.",
    riskLevel: AlertSeverity.HIGH,
    generatedAt: new Date(Date.now() - 43200000).toISOString(),
    actionSuggested: "Review browsing logs and consider enabling strict website allowlist.",
  },
];
