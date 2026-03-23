/**
 * app.config.js — Dynamic Expo config overlay for KAVACH Student mobile app.
 *
 * This file is loaded on top of app.json (Expo merges them automatically).
 * Use it to inject environment-specific values that cannot live in the static
 * app.json, e.g. the EAS project ID, which changes between dev / staging / prod.
 *
 * Usage:
 *   1. Copy env.example → .env and fill in your values.
 *   2. Run `eas init` to register a project — it will write your projectId here
 *      (via EAS_PROJECT_ID) so you never have to hard-code it.
 *
 * @param {import('@expo/config').ConfigContext} ctx
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  const isDev = process.env.APP_ENV !== 'production'

  return {
    ...config,

    // ── Name suffix in dev so the dev-client APK is visually distinct ────────
    name: isDev ? `${config.name} (dev)` : config.name,

    // ── Extra config — EAS project ID and runtime env flags ──────────────────
    extra: {
      ...config.extra,
      appEnv: process.env.APP_ENV ?? 'development',
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1',
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ??
          config.extra?.eas?.projectId ??
          'YOUR_EAS_PROJECT_ID',
      },
    },
  }
}
