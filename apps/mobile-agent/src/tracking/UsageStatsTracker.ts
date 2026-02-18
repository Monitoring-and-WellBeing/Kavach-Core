// TODO: Implement in Phase 2
// Will use Android UsageStatsManager API for app tracking
// Requires PACKAGE_USAGE_STATS permission

export class UsageStatsTracker {
  // stub
  async getUsageStats(_startTime: number, _endTime: number): Promise<void> {
    // TODO: Implement using Android UsageStatsManager via native module
    // Example: NativeModules.UsageStatsModule.getUsageStats(startTime, endTime)
    throw new Error("Not implemented — Phase 2");
  }

  async requestPermission(): Promise<boolean> {
    // TODO: Open Settings > Usage Access on Android
    return false;
  }

  async hasPermission(): Promise<boolean> {
    // TODO: Check if PACKAGE_USAGE_STATS permission is granted
    return false;
  }
}
