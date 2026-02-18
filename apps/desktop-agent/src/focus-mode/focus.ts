export interface FocusConfig {
  active: boolean;
  allowedApps: string[];
  blockedApps: string[];
  endTime?: Date;
}

let currentFocus: FocusConfig = {
  active: false,
  allowedApps: [],
  blockedApps: [],
};

export function startFocus(config: Omit<FocusConfig, "active">): void {
  currentFocus = { ...config, active: true };
}

export function endFocus(): void {
  currentFocus = { active: false, allowedApps: [], blockedApps: [] };
}

export function isFocusActive(): boolean {
  if (!currentFocus.active) return false;
  if (currentFocus.endTime && new Date() > currentFocus.endTime) {
    endFocus();
    return false;
  }
  return true;
}

export function isAppAllowedInFocus(appName: string): boolean {
  if (!isFocusActive()) return true;
  if (currentFocus.blockedApps.includes(appName)) return false;
  if (currentFocus.allowedApps.length > 0) {
    return currentFocus.allowedApps.includes(appName);
  }
  return true;
}

export function getFocusState(): FocusConfig {
  return currentFocus;
}
