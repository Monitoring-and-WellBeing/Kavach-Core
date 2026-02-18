// TODO: Implement in Phase 2
// Will sync usage logs to backend via REST API
// Supports offline buffering using AsyncStorage

export class MobileSyncer {
  // stub

  async sync(_logs: unknown[]): Promise<void> {
    // TODO: POST logs to backend API
    // Handle offline state by buffering to AsyncStorage
    throw new Error("Not implemented — Phase 2");
  }

  async flushBuffer(): Promise<void> {
    // TODO: Read buffered logs from AsyncStorage and sync
    throw new Error("Not implemented — Phase 2");
  }

  async isOnline(): Promise<boolean> {
    // TODO: Use NetInfo to check network connectivity
    return false;
  }
}
