// TODO: Implement in Phase 2
// Will handle device registration and JWT auth token management
// Tokens stored securely using react-native-keychain

export class DeviceAuth {
  // stub

  async linkDevice(_code: string): Promise<{ success: boolean; token?: string }> {
    // TODO: POST to /api/v1/devices/link with 6-char code
    // Store returned JWT in secure storage
    return { success: false };
  }

  async getToken(): Promise<string | null> {
    // TODO: Read JWT from react-native-keychain
    return null;
  }

  async clearAuth(): Promise<void> {
    // TODO: Remove stored credentials
    throw new Error("Not implemented — Phase 2");
  }

  async isLinked(): Promise<boolean> {
    // TODO: Check if device has a valid stored token
    return false;
  }
}
