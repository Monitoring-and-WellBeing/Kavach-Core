/**
 * OverlayManager — shows a full-screen Android overlay when a blocked app is
 * detected in the foreground.
 *
 * We can't force-kill third-party apps on Android without root, so instead we
 * display a friction overlay explaining why the app is limited.  The student
 * can dismiss it, but the event is logged.
 *
 * Requires:
 *  • SYSTEM_ALERT_WINDOW permission (granted by user in Settings)
 *  • OverlayModule native module (injected by a custom dev-build / bare workflow)
 *    — the withOverlay.js config plugin adds the service to AndroidManifest.
 *
 * On iOS: no-op (iOS does not permit this kind of overlay).
 */
import { NativeModules, Platform } from 'react-native'

export interface BlockedApp {
  packageName: string
  appName: string
  reason: string
  minutesRemaining?: number
}

export const OverlayManager = {
  /**
   * Show a full-screen warning overlay for a specific blocked app.
   * Safe to call when OverlayModule is unavailable (Expo Go, iOS, etc.).
   */
  async showBlockedOverlay(
    appName: string,
    reason: string,
    minutesRemaining?: number
  ): Promise<void> {
    if (Platform.OS !== 'android') return

    const { OverlayModule } = NativeModules
    if (!OverlayModule?.show) return

    const message = minutesRemaining != null && minutesRemaining > 0
      ? `You have ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} left today for this app.`
      : `This app is blocked right now. ${reason}`

    await OverlayModule.show({
      title: `${appName} is limited`,
      message,
      buttonText: 'Got it',
      color: '#2563EB',
    })
  },

  /**
   * Given the currently visible package name and the tenant's blocked-app list,
   * show an overlay if the foreground app is restricted.
   */
  async checkAndOverlay(
    currentPackage: string,
    blockedApps: BlockedApp[]
  ): Promise<void> {
    const match = blockedApps.find((b) =>
      currentPackage.toLowerCase().includes(b.packageName.toLowerCase())
    )
    if (match) {
      await this.showBlockedOverlay(
        match.appName,
        match.reason,
        match.minutesRemaining
      )
    }
  },

  /**
   * Check whether SYSTEM_ALERT_WINDOW permission has been granted.
   * Returns false on iOS or when the native module is unavailable.
   */
  async hasOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false
    const { OverlayModule } = NativeModules
    if (!OverlayModule?.hasPermission) return false
    return OverlayModule.hasPermission()
  },

  /**
   * Open Android Settings → Special App Access → Display over other apps.
   * Call this when hasOverlayPermission() returns false.
   */
  async requestOverlayPermission(): Promise<void> {
    if (Platform.OS !== 'android') return
    const { OverlayModule } = NativeModules
    if (!OverlayModule?.requestPermission) return
    await OverlayModule.requestPermission()
  },
}
