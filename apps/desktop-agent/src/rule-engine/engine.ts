import { Rule, RuleType } from "@kavach/shared-types";

export interface RuleCheckResult {
  blocked: boolean;
  reason?: string;
  ruleId?: string;
}

export function checkRules(
  appName: string,
  category: string,
  currentTime: Date,
  rules: Rule[]
): RuleCheckResult {
  for (const rule of rules) {
    if (rule.status !== "ACTIVE") continue;

    if (rule.type === RuleType.CATEGORY_BLOCK && rule.target === category) {
      return {
        blocked: true,
        reason: `Category "${category}" is blocked`,
        ruleId: rule.id,
      };
    }

    if (rule.type === RuleType.APP_LIMIT && rule.target === appName) {
      // Check if limit exceeded (tracked usage would be passed in real implementation)
      return { blocked: false, ruleId: rule.id };
    }

    if (rule.type === RuleType.SCHEDULE_BLOCK) {
      const hour = currentTime.getHours();
      const minute = currentTime.getMinutes();
      const [startH, startM] = (rule.scheduleStart || "09:00").split(":").map(Number);
      const [endH, endM] = (rule.scheduleEnd || "17:00").split(":").map(Number);

      const currentMinutes = hour * 60 + minute;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        if (rule.target === category) {
          return {
            blocked: true,
            reason: `Blocked during scheduled hours`,
            ruleId: rule.id,
          };
        }
      }
    }
  }

  return { blocked: false };
}
