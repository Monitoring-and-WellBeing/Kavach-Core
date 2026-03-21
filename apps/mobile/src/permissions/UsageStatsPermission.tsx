/**
 * UsageStatsPermission — requests Android PACKAGE_USAGE_STATS permission.
 *
 * UsageStatsManager is not accessible unless the user explicitly grants
 * "Usage Access" in Android Settings → Apps → Special App Access.
 * This helper checks the current state and shows a friendly explanation
 * before deep-linking into Settings.
 */
import { Alert, Linking, Platform } from 'react-native'
import { NativeModules } from 'react-native'

/**
 * Returns true if permission is already granted or the user tapped "Grant".
 * Returns false on iOS (unsupported) or if the user tapped "Not Now".
 */
export async function requestUsageStatsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  // UsageStatsManager is injected by the native module (requires bare workflow
  // or a custom dev-build).  In Expo Go it will be undefined — guard against it.
  const { UsageStatsManager } = NativeModules
  if (UsageStatsManager?.hasPermission) {
    const already = await UsageStatsManager.hasPermission()
    if (already) return true
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Usage Access Needed',
      'KAVACH needs to see which apps you use so your parents can help you stay balanced. ' +
        'This also helps you earn rewards! 🏆\n\n' +
        'Tap "Grant Access" → find KAVACH in the list → enable Usage Access.',
      [
        {
          text: 'Grant Access',
          onPress: () => {
            // Deep-link to Android → Settings → Special App Access → Usage Access
            Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS').catch(
              () => Linking.openSettings()
            )
            resolve(true)
          },
        },
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => resolve(false),
        },
      ],
      { cancelable: false }
    )
  })
}

/**
 * Quick check (no UI) — call this on resume to decide whether to start tasks.
 */
export async function hasUsageStatsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false
  const { UsageStatsManager } = NativeModules
  if (!UsageStatsManager?.hasPermission) return false
  return UsageStatsManager.hasPermission()
}
