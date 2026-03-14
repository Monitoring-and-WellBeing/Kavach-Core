// ─── Usage Tracker ────────────────────────────────────────────────────────────
// Accumulates foreground-window time per process name.
// EnforcementEngine calls update() on every 2-second enforcement cycle.
// RuleSync calls getAndReset() every 5 minutes to flush the buffer to the backend.
//
// The accumulated data is reported to POST /enforcement/usage so the backend
// can track cross-platform daily limits (desktop + Android totals combined).

export class UsageTracker {
  /** Accumulated active time per process in milliseconds. */
  private usageAccumulator = new Map<string, number>()
  private lastActiveProcess: string | null = null
  private lastCheckTime = Date.now()

  /**
   * Called every enforcement cycle with the currently active foreground process.
   * Adds the elapsed time since the last call to that process's accumulator.
   */
  update(currentProcess: string): void {
    const now = Date.now()
    const elapsed = now - this.lastCheckTime

    if (this.lastActiveProcess) {
      const current = this.usageAccumulator.get(this.lastActiveProcess) || 0
      this.usageAccumulator.set(this.lastActiveProcess, current + elapsed)
    }

    this.lastActiveProcess = currentProcess
    this.lastCheckTime = now
  }

  /**
   * Returns accumulated usage (in seconds) and resets the accumulator.
   * Called by RuleSync every 5 minutes before flushing to the backend.
   */
  getAndReset(): Record<string, number> {
    const result: Record<string, number> = {}
    for (const [process, ms] of this.usageAccumulator.entries()) {
      result[process] = Math.floor(ms / 1000)  // convert ms → seconds
    }
    this.usageAccumulator.clear()
    return result
  }
}

/** Singleton shared by EnforcementEngine and RuleSync. */
export const activeAppUsage = new UsageTracker()
