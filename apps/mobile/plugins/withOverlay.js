/**
 * Expo Config Plugin — adds Android Overlay / Accessibility Service declarations
 * and SYSTEM_ALERT_WINDOW permission to the AndroidManifest.xml.
 *
 * This is required because:
 *  • Expo Managed Workflow cannot ship native modules directly.
 *  • The OverlayService needs a manifest entry + the special permission.
 *  • On Android 10+ SYSTEM_ALERT_WINDOW requires user consent via Settings.
 */
const { withAndroidManifest } = require('@expo/config-plugins')

module.exports = function withOverlay(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults
    const application = manifest.manifest.application[0]

    // ── Overlay / Accessibility service ─────────────────────────────────────
    if (!application.service) application.service = []

    // Avoid duplicate entries on repeated prebuild runs
    const alreadyHas = application.service.some(
      (s) => s.$['android:name'] === '.KavachOverlayService'
    )
    if (!alreadyHas) {
      application.service.push({
        $: {
          'android:name': '.KavachOverlayService',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
          'android:label': 'KAVACH Screen Monitor',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/kavach_accessibility_service',
            },
          },
        ],
      })
    }

    // ── SYSTEM_ALERT_WINDOW permission ───────────────────────────────────────
    if (!manifest.manifest['uses-permission']) {
      manifest.manifest['uses-permission'] = []
    }
    const hasOverlayPerm = manifest.manifest['uses-permission'].some(
      (p) => p.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
    )
    if (!hasOverlayPerm) {
      manifest.manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' },
      })
    }

    // ── BIND_ACCESSIBILITY_SERVICE permission ────────────────────────────────
    const hasA11yPerm = manifest.manifest['uses-permission'].some(
      (p) =>
        p.$['android:name'] ===
        'android.permission.BIND_ACCESSIBILITY_SERVICE'
    )
    if (!hasA11yPerm) {
      manifest.manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:maxSdkVersion': '32',
        },
      })
    }

    return config
  })
}
