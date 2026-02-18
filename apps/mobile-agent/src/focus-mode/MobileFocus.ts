// TODO: Implement in Phase 2
// Will use Android Accessibility Service or Device Policy Manager
// to enforce focus mode by blocking non-allowed apps

export class MobileFocus {
  // stub

  start(_durationMinutes: number, _allowedApps: string[]): void {
    // TODO: Activate focus mode using Accessibility Service
    throw new Error("Not implemented — Phase 2");
  }

  end(): void {
    // TODO: Deactivate focus mode
    throw new Error("Not implemented — Phase 2");
  }

  isActive(): boolean {
    // TODO: Return current focus mode state
    return false;
  }

  getRemainingMinutes(): number {
    // TODO: Calculate remaining time in current focus session
    return 0;
  }
}
