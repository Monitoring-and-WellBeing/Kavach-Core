# Desktop Agent — Production Readiness Fixes

**Date:** March 15, 2026
**Branch:** `dev`
**Scope:** Full production audit of `apps/desktop-agent` before Windows installer distribution

---

## Overview

After the web-app frontend was stabilised for Vercel deployment, a production readiness audit was run on the Electron desktop agent. The audit identified **5 issues** ranging from critical (double enforcement causing duplicate kill attempts and duplicate usage reports) to production-blocking (localhost URL shipped in production builds).

All issues were fixed in-place on the `dev` branch.

---

## Fix 1 — Dual Enforcement System (Critical)

**Files:** `src/tracking/trackingLoop.ts`, `src/main.ts`
**Severity:** 🔴 Critical — double-kills processes, double-reports usage to parent dashboard

### Problem

`main.ts` started **both** enforcement systems simultaneously on every linked device:

```ts
// main.ts (before fix) — BOTH systems running in parallel
startTrackingLoop()                // OLD: polls /blocking/rules/{id}/agent every 60s
await startEnforcement(deviceId)   // NEW: polls /enforcement/state/{id} every 30s
```

This caused:

| Symptom | Root cause |
|---|---|
| Parent sees doubled violation events | Both `trackingLoop` (via `violationReporter.ts`) and `EnforcementEngine` POSTed to `/enforcement/events` for the same kill |
| Parent sees doubled app usage minutes | `syncer.ts` POSTed to `/api/v1/activity` AND `RuleSync.reportUsage()` POSTed to `/enforcement/usage` — same time attributed to both systems |
| Process killed twice per violation | `trackingLoop` killed via `processKiller.ts`; `EnforcementEngine` killed via `taskkill /F /PID /T` — within 2–5 seconds of each other |
| Duplicate "rules fetches" causing extra load | `/blocking/rules/{id}/agent` AND `/enforcement/state/{id}` both fetched on overlapping schedules |

### Fix

Added `skipLegacyEnforcement` option to `startTrackingLoop()`:

```ts
// trackingLoop.ts — new options interface
export interface TrackingLoopOptions {
  /**
   * When true, the legacy blocking engine and focus enforcer are SKIPPED.
   * Set this to true when EnforcementEngine is active so the two systems
   * don't double-kill processes and double-report usage.
   * Activity session recording (→ /api/v1/activity) still runs in both modes.
   */
  skipLegacyEnforcement?: boolean
}
```

`main.ts` now passes `{ skipLegacyEnforcement: true }` on all linked-device paths:

```ts
// main.ts (after fix)
startTrackingLoop({ skipLegacyEnforcement: true })  // activity logging only
await startEnforcement(deviceId)                    // EnforcementEngine owns all blocking
```

**What still runs in the tracking loop:**
- `syncer.ts` → activity session recording → `/api/v1/activity` (richer data: window title, exact start/end times)
- `sendHeartbeat()` (moved to enforcement stack — see Fix 4)

**What is skipped in the tracking loop when `skipLegacyEnforcement=true`:**
- `shouldBlock()` — old rule evaluation
- `killProcess()` — old process termination
- `reportViolation()` — old violation reporting
- `isFocusBlocked()` / `pollFocusStatus()` — old focus enforcement
- `refreshBlockRules()` interval — old rule polling

---

## Fix 2 — Localhost URL Shipped in Production Builds

**File:** `src/auth/config.ts`
**Severity:** 🔴 Critical — agent connects to `localhost:8080` in production, all API calls fail

### Problem

```ts
// config.ts (before fix)
apiUrl: process.env.API_URL || 'http://localhost:8080',
```

Electron apps read environment variables **at startup from the OS environment**, not from a `.env` file. In production Windows installer builds, `API_URL` is never set — so the agent used `http://localhost:8080` and every API call (`generate-code`, `check-linked`, enforcement sync, usage report) failed silently.

The agent would appear to start but:
- Device linking would fail — `generate-code` returned connection refused
- If somehow linked (from a previous session with the correct URL stored in `kavach-config.json`), enforcement sync would fail on every new install

### Fix

```ts
// config.ts (after fix) — Railway backend is the safe production default
apiUrl: process.env.API_URL || 'https://kavach-core-production.up.railway.app',
```

> **For dev builds:** Set `API_URL=http://localhost:8080` in your shell before running `pnpm dev` in the desktop-agent directory.
> **For production installer builds:** Either rely on the new default above, or inject via `electron-builder`'s `extraMetadata` if you want to support multiple environments.

---

## Fix 3 — `electron-builder.json` Missing Critical Files & Config

**File:** `electron-builder.json`
**Severity:** 🔴 Critical — built installer missing renderer HTML (blank window on first launch) and assets (broken icon in tray and taskbar)

### Problem

```json
// electron-builder.json (before fix) — renderer and assets excluded
{
  "files": ["dist/**/*", "package.json"]
}
```

The `renderer/index.html` (the device-linking UI shown to the student) and `assets/` (tray icon, window icon) were never included in the installer. Resulting in:
- Blank white window on first launch instead of the link-code screen
- Missing tray icon (system tray showed generic blank icon)
- Windows taskbar showed no icon

Also missing:
- `nsis` configuration (installer name, per-user install, run-after-finish)
- `win.icon` pointing to `assets/icon.ico`
- `mac.target` for both `x64` and `arm64` (Apple Silicon)
- `directories.output` pointed to same `dist/` as TypeScript output — conflicted

### Fix

```json
{
  "appId": "com.kavach.desktop-agent",
  "productName": "KAVACH AI Agent",
  "directories": {
    "output": "dist-build",           ← separate from TS build output
    "buildResources": "assets"
  },
  "files": [
    "dist/**/*",
    "renderer/**/*",                  ← link-code UI HTML
    "package.json"
  ],
  "extraResources": [
    { "from": "assets", "to": "assets", "filter": ["**/*"] }
  ],
  "win": {
    "target": [{ "target": "nsis", "arch": ["x64"] }],
    "icon": "assets/icon.ico",
    "publisherName": "KAVACH AI"
  },
  "nsis": {
    "oneClick": true,
    "perMachine": false,             ← no admin rights required
    "shortcutName": "KAVACH AI Agent",
    "runAfterFinish": true,
    "deleteAppDataOnUninstall": false ← preserve kavach-config.json on uninstall
  },
  "mac": {
    "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }],
    "icon": "assets/icon.icns"
  }
}
```

---

## Fix 4 — Heartbeat Never Sent After Device Linking

**Files:** `src/main.ts`
**Severity:** 🟡 Medium — parent dashboard always shows device as "Offline" even when agent is running

### Problem

`sendHeartbeat()` was defined in `deviceRegistration.ts` and imported in `trackingLoop.ts` (called in the sync timer). But with `skipLegacyEnforcement=true`, the sync timer in trackingLoop still ran — so heartbeats did still fire via the legacy tracking loop. However, the heartbeat was architecturally misplaced: it should be the enforcement stack's responsibility, not the activity logger's.

More critically: if the tracking loop was ever disabled or crashed, heartbeats would stop entirely and the device would appear offline.

### Fix

Heartbeat is now explicitly wired into `startEnforcement()` in `main.ts`:

```ts
// main.ts — inside startEnforcement()
// 9. Heartbeat — send device keep-alive every 30 s so parent sees "Online"
sendHeartbeat().catch(() => {})
heartbeatTimer = setInterval(() => sendHeartbeat().catch(() => {}), 30_000)
```

And stopped in `stopEnforcement()`:
```ts
if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
```

The device now shows as online immediately on enforcement start and sends a keep-alive every 30 seconds independently of the activity sync cycle.

---

## Fix 5 — `package.json` Duplicate `scripts` Block

**File:** `package.json`
**Severity:** 🟡 Medium — code quality / confusing for contributors; second block silently overrides first

### Problem

```json
{
  "scripts": { "dev": "ts-node src/main.ts", "build": "tsc", ... },   // block 1
  "dependencies": { ... },
  "scripts": { "dev": "ts-node src/main.ts", "build": "tsc", "test": "jest" }  // block 2
}
```

Node.js JSON parsing takes the last duplicate key. The `pack` and `build:full` scripts existed only in the first block — they were silently dropped. CI commands relying on `pnpm pack` would silently fail.

### Fix

Merged into a single `scripts` block with all commands:

```json
{
  "scripts": {
    "dev": "ts-node src/main.ts",
    "build": "tsc",
    "build:full": "tsc && electron-builder",
    "pack": "electron-builder",
    "dist:win": "tsc && electron-builder --win",
    "dist:mac": "tsc && electron-builder --mac",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "tsc --noEmit",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Architecture Reference — Enforcement Stack After Fixes

```
main.ts (app.whenReady)
  │
  ├── initializeAgent()
  │     ├── loadConfig()
  │     └── if (deviceLinked)
  │           ├── startTrackingLoop({ skipLegacyEnforcement: true })
  │           │     ├── getActiveWindow() every 5s  → trackAppTime()
  │           │     ├── syncSessions() every 30s    → POST /api/v1/activity
  │           │     └── sendHeartbeat() every 30s   ← REMOVED (now in enforcement)
  │           │
  │           └── startEnforcement(deviceId)
  │                 ├── timeSync.sync()             → GET /api/v1/health/time
  │                 ├── EnforcementEngine           → taskkill every 2s
  │                 ├── ScreenshotCapture           → POST /screenshots/upload
  │                 ├── BrowserMonitor              → PowerShell title check every 2s
  │                 ├── RuleSync.start()
  │                 │     ├── SSE  /sse/device/{id} → instant push on rule change
  │                 │     ├── Poll /enforcement/version/{id} every 30s
  │                 │     └── Report /enforcement/usage every 5 min
  │                 ├── SelfProtection              → tasklist check every 3s
  │                 ├── SelfProtection.registerStartup() → HKCU Run key
  │                 └── heartbeatTimer              → POST /devices/{id}/heartbeat every 30s ✅ NEW
```

---

## Summary of Files Changed

| File | Change |
|---|---|
| `package.json` | Removed duplicate `scripts` block; added `test:coverage`, `dist:win`, `dist:mac`, `lint`, `type-check` |
| `src/auth/config.ts` | Changed localhost fallback to Railway backend URL |
| `electron-builder.json` | Added `renderer/**/*` to files; added `extraResources` for assets; added `nsis` config; fixed `directories.output`; added `win.icon`, `mac.target` arm64 |
| `src/tracking/trackingLoop.ts` | Added `TrackingLoopOptions` interface; `skipLegacyEnforcement` flag disables old blocking/focus/rules-refresh when `EnforcementEngine` is active |
| `src/main.ts` | All `startTrackingLoop()` calls now pass `{ skipLegacyEnforcement: true }`; imported `sendHeartbeat`; added `heartbeatTimer` with 30s interval wired into enforcement start/stop lifecycle |
