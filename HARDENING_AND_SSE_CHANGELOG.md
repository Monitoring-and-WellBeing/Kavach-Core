# Kavach AI — Pre-Pilot Hardening & SSE Migration
### Engineering Changelog · March 2026

---

## Overview

This document records every change made during the **pre-pilot hardening sprint** of the Kavach AI monorepo.  
Two major bodies of work were completed:

1. **Pre-Pilot Hardening** — database migrations, environment variable unification, build fixes, test fixes, and production blocker detection.
2. **SSE Migration** — replacing the planned (but unimplemented) WebSocket layer with Server-Sent Events (SSE) across the full stack: backend, web app, desktop agent, and nginx.

---

## Part 1 — Pre-Pilot Hardening

### 1.1 Demo Seed Data Removal

**File:** `backend/src/main/resources/db/migration/V26__remove_demo_seed_data.sql`  
**Type:** New Flyway migration

Purges all demo data (tenant `a1b2c3d4-e5f6-7890-abcd-ef1234567890`) seeded by earlier migrations (V1, V6, V9, V10). Removes subscriptions, goals, focus whitelist entries, focus sessions, devices, and the demo tenant itself. Cascade deletes handle dependent tables (activity logs, alerts, rewards, challenges).

---

### 1.2 Production Environment Variable Unification

#### Backend — `backend/env.example`
Added explicit, documented placeholders for all production-critical variables:
- `JWT_SECRET` — minimum 32-character random string, HS256
- `JWT_ACCESS_EXPIRY` / `JWT_REFRESH_EXPIRY` — sensible defaults (15 min / 7 days)
- `CORS_ORIGINS` — comma-separated list for production domain
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` — Cloudflare R2 storage
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — payment gateway

#### Backend — `backend/src/main/resources/application-prod.yml` (NEW)
Production-specific Spring Boot profile:
- `spring.jpa.hibernate.ddl-auto: validate` — no schema mutation in production
- `springdoc.swagger-ui.enabled: false` — Swagger UI disabled in production
- `logging.level.root: INFO` — no DEBUG logs in production
- `management.endpoint.health.show-details: never` — hides internals from health endpoint

#### Web App — `apps/web-app/env.example`
Added `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` flag.

#### Desktop Agent — `apps/desktop-agent/env.example`
Added `DEBUG=false` flag for controlling logging verbosity.

#### Mobile App — `apps/mobile/env.example` (NEW)
Created environment variable template for the React Native/Expo app:
- `EXPO_PUBLIC_API_URL` — backend API URL
- `EXPO_PUBLIC_TRACKING_INTERVAL` — background poll interval
- `EXPO_PUBLIC_DEBUG` — debug logging toggle

#### Docker Compose — `docker-compose.yml`
Added all R2 and Razorpay environment variables to the backend service block with safe empty defaults for local development.

---

### 1.3 Login Page Demo Credential Guard

**File:** `apps/web-app/src/app/(auth)/login/page.tsx`

Changed `showDemoCredentials` from a hardcoded `true` to:
```typescript
const showDemoCredentials = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true";
```
Pre-filled email inputs and the credential hint block are now gated behind this flag. Default in all `env.example` files is `false`.

---

### 1.4 Duplicate Flyway Migration Fix (Production Blocker)

**Files:** `backend/src/main/resources/db/migration/V21__location_geofences.sql` and `V24__location_geofences.sql`

**Problem:** V21 and V24 were byte-for-byte identical. Flyway would have crashed on first production deployment with `ERROR: relation already exists`.

**Fix:** Replaced V24 with a safe no-op (`SELECT 1;`) to preserve version continuity without re-running the DDL.

---

### 1.5 Spring Bean Conflict Resolutions

Three duplicate Spring component name conflicts were found and resolved:

| Original Bean | Package | Conflict | Fix |
|---|---|---|---|
| `MoodController` | `com.kavach.ai` | Name clash with `com.kavach.mood.MoodController` | Renamed to `aiMoodController`, moved base path to `/api/v1/ai/mood`, removed duplicate endpoints |
| `MoodService` | `com.kavach.ai.service` | Name clash with `com.kavach.mood.service.MoodService` | Renamed to `aiMoodService` |
| `MoodCheckinRepository` | `com.kavach.ai.repository` | Name clash + JPA entity name clash with `com.kavach.mood.repository.MoodCheckinRepository` | Renamed file and interface to `AiMoodCheckinRepository`; renamed JPA entity to `@Entity(name = "AiMoodCheckin")` |

All JPQL queries in `AiMoodCheckinRepository` updated from `FROM MoodCheckin m` to `FROM AiMoodCheckin m`.  
`MotivationService.java` updated to import the renamed repository.

---

### 1.6 TypeScript Build Fixes

#### Web App (`apps/web-app`)
| File | Error | Fix |
|---|---|---|
| `components/layout/TopBar.tsx` | `Cannot find name 'Link'` | Added `import Link from "next/link"` |
| `app/parent/insights/page.tsx` | `string \| null \| undefined` not assignable to `string \| undefined` | Changed to `?.assignedTo \|\| undefined` |

#### Desktop Agent (`apps/desktop-agent`)
| File | Error | Fix |
|---|---|---|
| `enforcement/RuleSync.ts` | `UrlBlockRule` missing `id` property | Added `id: r.id` to the `.map()` |
| `focus/focusEnforcer.ts` | `unknown` type on `res.json()` | Cast to `AgentFocusStatus`; replaced `typeof window !== 'undefined'` with `process.type === 'renderer'` |
| `screenshots/ScreenshotCapture.ts` | `unknown` type on `res.json()` | Cast to `ScreenshotSettings` |
| `blocking/blockingEngine.ts` | `unknown` type on `data` | Cast to `AgentBlockRule[]` |
| `sync/deviceRegistration.ts` | `unknown` on `response.json()` | Cast to typed response shapes |
| `__tests__/enforcementEngine.test.ts` | `RuleSync` constructor expected 3 args, got 2 | Added `BrowserMonitor` mock; updated `ruleType` field to `type: 'BLOCK_APP'` |

#### Mobile App (`apps/mobile`)
| File | Error | Fix |
|---|---|---|
| `screens/DashboardScreen.tsx` | Casing mismatch `MoodCheckin` vs `MoodCheckIn` | Fixed import casing |
| `screens/DashboardScreen.tsx` | `background: 'linear-gradient(...)'` invalid in React Native `StyleSheet` | Removed invalid property, kept `backgroundColor` |

---

### 1.7 Backend Test Fixes (75 tests → all pass)

#### Mockito `InvalidUseOfMatchers` — 3 files

All raw UUID arguments passed alongside Mockito matchers (e.g., `any()`) were wrapped in `eq()`:

- `GoalEvaluationServiceTest.java` — 5 test methods fixed
- `AlertEvaluationServiceTest.java` — 4 test methods fixed
- `BadgeEvaluationServiceTest.java` — 2 test methods fixed

#### `UnnecessaryStubbing` — 1 file

`BlockingServiceTest.java` — removed `when(ruleRepo.findActiveRulesForDevice(...))` stub from the paused-device test (service returns early before calling that repo method).

#### Incorrect `doNothing()` usage — 1 file

`FocusServiceTest.java` — `BadgeEvaluationService.evaluateAndAwardBadges()` returns `List<String>`, not void.  
Changed `doNothing().when(...)` to `when(...).thenReturn(List.of())`.

---

## Part 2 — SSE Migration (WebSocket → Server-Sent Events)

### 2.1 Architecture Decision

All real-time data flows in Kavach are **server → client only**:

| Channel | Direction | Data |
|---|---|---|
| Backend → Parent Dashboard | Server → Client | Live alerts, rule changes |
| Backend → Desktop Agent | Server → Client | Rule pushes, focus start/end |
| Desktop Agent → Backend | Client → Server | Activity logs (existing HTTP POST) |
| Mobile → Backend | Client → Server | Mood check-ins, usage (existing HTTP POST) |

Since there is no client-initiated real-time message, WebSocket is unnecessary overhead. SSE is:
- Simpler (plain HTTP, no protocol upgrade)
- Works through all load balancers and proxies without sticky sessions
- Has built-in browser reconnection
- Requires zero additional Spring dependencies (`SseEmitter` is built-in)

---

### 2.2 Backend — New SSE Infrastructure

#### `backend/src/main/java/com/kavach/sse/SseRegistry.java` (NEW)

Thread-safe in-memory registry of all active SSE connections. Manages:
- `tenantEmitters: Map<UUID, Set<SseEmitter>>` — parent dashboard clients (multi-tab supported via `CopyOnWriteArraySet`)
- `deviceEmitters: Map<String, SseEmitter>` — desktop agent clients (one per device)
- `tenantDevices: Map<UUID, Set<String>>` — cross-reference for fan-out when a rule applies to ALL_DEVICES

Public API:
```java
SseEmitter registerTenant(UUID tenantId)
SseEmitter registerDevice(String deviceId, UUID tenantId)
void sendToTenant(UUID tenantId, String eventName, Object data)
void sendToDevice(String deviceId, String eventName, Object data)
void sendToTenantDevices(UUID tenantId, String eventName, Object data)
int tenantCount()  // diagnostics
int deviceCount()  // diagnostics
```

Cleanup is automatic: each emitter removes itself from the registry on completion, timeout, or error.

---

#### `backend/src/main/java/com/kavach/sse/SseController.java` (NEW)

Exposes three endpoints:

| Endpoint | Auth | Consumer | Events pushed |
|---|---|---|---|
| `GET /api/v1/sse/tenant` | JWT | Parent dashboard (web app) | `alert`, `rules_updated` |
| `GET /api/v1/sse/device/{deviceId}` | None (device-auth) | Desktop agent | `rules_updated`, `focus_start`, `focus_end` |
| `GET /api/v1/sse/health` | None | Monitoring | JSON: active connection counts |

The device endpoint looks up `tenantId` from the `DeviceRepository` so the registry can maintain the tenant→devices cross-reference for ALL_DEVICES fan-out.

---

### 2.3 Backend — SSE Wired Into Services

#### `AlertEvaluationService.java`

After every `alertRepo.save(alert)` in three methods:
- `fireAlert()` — scheduled rule evaluation fires alert
- `triggerKillToolAlert()` — bypass tool detected on device
- `triggerBlockedAppAlert()` — blocked app attempt on device

Pushes `alert` event to `sseRegistry.sendToTenant(tenantId, "alert", payload)` with fields: `id, title, message, severity, ruleType, deviceId`.

#### `BlockingService.java`

After `createRule()`, `toggleRule()`, `deleteRule()`:
- If rule has a `deviceId` → `sendToDevice(deviceId, "rules_updated", payload)`
- If rule is ALL_DEVICES → `sendToTenantDevices(tenantId, "rules_updated", payload)`
- Always → `sendToTenant(tenantId, "rules_updated", payload)` (refreshes parent dashboard)

#### `FocusService.java`

- `startSession()` → `sendToDevice(deviceId, "focus_start", { sessionId, durationMinutes, endsAt })`
- `stopSession()` → `sendToDevice(deviceId, "focus_end", { sessionId, reason })`

Desktop agent receives these events and immediately triggers a `fullSync()` to pick up the updated focus whitelist.

#### `RuleController.java`

The `// TODO: Push rule to device via WebSocket` comment has been fully replaced. All five mutation endpoints (`create`, `update`, `delete`, `sync`, `toggle`) now:
1. Perform the rule mutation
2. Resolve `tenantId` from the authenticated user's email
3. Push `rules_updated` via SSE to affected device(s) and the parent dashboard
4. Include an `action` field in the payload (`"created"`, `"updated"`, `"deleted"`, `"synced"`, `"toggled"`)

---

### 2.4 Backend — Security Config Update

**File:** `backend/src/main/java/com/kavach/security/SecurityConfig.java`

Added to the `permitAll()` list:
```
/api/v1/sse/device/**   (desktop agent — authenticates by deviceId, no JWT)
/api/v1/sse/health      (monitoring endpoint — public)
```

The tenant SSE endpoint (`/api/v1/sse/tenant`) remains JWT-protected.

---

### 2.5 Web App — SSE Hook

#### `apps/web-app/src/hooks/useSSE.ts` (NEW)

Reusable `EventSource` wrapper hook:
- Connects to `${NEXT_PUBLIC_API_URL}${path}` with `withCredentials: true`
- Registers named event listeners for each key in the `handlers` map
- Handler functions are kept in a `useRef` so they stay fresh across renders without recreating the connection
- On `onerror`: closes the connection and auto-reconnects after **5 seconds**
- Cleans up on component unmount

```typescript
useSSE(
  "/api/v1/sse/tenant",
  { alert: handleAlert, rules_updated: handleRulesUpdated },
  enabled  // optional — skips connecting when false
)
```

---

### 2.6 Web App — Real-Time Alerts Hook

#### `apps/web-app/src/hooks/useAlerts.ts` (REWRITTEN)

Previously used hardcoded mock data. Now:

1. **On mount:** fetches up to 50 historical alerts from `GET /api/v1/alerts` via `alertsApi`
2. **Via SSE:** subscribes to `/api/v1/sse/tenant` and prepends new `alert` events to the list in real time (deduplicates by `id`)
3. **`markRead(id)`** — optimistic local update + `PATCH /api/v1/alerts/{id}/read`
4. **`markAllRead()`** — optimistic local update + `POST /api/v1/alerts/read-all`
5. **`mergeHistorical(alerts)`** — for pagination: merges additional REST pages without duplicating live SSE alerts
6. **`loading`** — boolean flag while the initial REST fetch is in flight

Type mapping (`ruleType` → `AlertType`, severity → `AlertSeverity`) handles all backend enum values including `LATE_NIGHT_USAGE`, `FOCUS_MODE_BROKEN`, `CRITICAL`.

---

### 2.7 Desktop Agent — SSE Subscription

#### `apps/desktop-agent/src/enforcement/RuleSync.ts` (UPDATED)

Added `connectSse()` method alongside the existing 30-second version-check poll:

**SSE behaviour:**
- Connects to `${apiBase}/sse/device/${deviceId}` on `start()`
- Listens for three named events:
  - `rules_updated` → immediately calls `fullSync()` (no waiting for the 30 s poll)
  - `focus_start` → calls `fullSync()` to pick up updated focus whitelist
  - `focus_end` → calls `fullSync()` to disable focus enforcement
- On `onerror`: closes and reconnects after **10 seconds**
- `stop()` closes the SSE emitter and clears the reconnect timer

**Fallback behaviour:**
- The 30-second version-check poll is **retained** as a belt-and-suspenders fallback
- If `EventSource` is not available (older Node version), the agent logs a warning and falls back to polling only
- No rules are ever dropped: enforcement continues from cached state during any outage

---

### 2.8 Mobile App — No SSE (By Design)

The React Native/Expo mobile app **does not use SSE** and was intentionally not changed.

**Reasons:**
- Android and iOS aggressively kill background TCP connections
- SSE requires a persistent open HTTP connection — battery-hostile on mobile
- The mobile app already uses `expo-background-fetch` (periodic polling) and FCM/APNs push notifications for real-time delivery
- These are the platform-native, battery-efficient equivalents of SSE for mobile

---

### 2.9 Nginx — SSE Proxy Configuration

**File:** `infra/nginx-config/nginx.conf`

**Removed:** `/ws/` WebSocket proxy block (Upgrade headers, `Connection: Upgrade`)

**Added:** `/api/v1/sse/` SSE proxy block with correct settings:

```nginx
location /api/v1/sse/ {
    proxy_pass http://kavach_backend;
    proxy_http_version 1.1;
    proxy_buffering off;          # CRITICAL — events must flow immediately
    proxy_cache off;
    add_header X-Accel-Buffering no;
    proxy_read_timeout 3600s;     # Hold the long-lived connection
    proxy_send_timeout 3600s;
    keepalive_timeout 3600s;
}
```

The general `/api/` block was also cleaned up — `Upgrade` and `Connection: upgrade` headers removed (they are only valid for WebSocket and would pollute non-upgrade REST requests).

---

## Test Results After All Changes

| Component | Tests | Failures | Errors | Result |
|---|---|---|---|---|
| Backend (Spring Boot / Maven) | **75** | **0** | **0** | ✅ PASS |
| Web App (TypeScript check) | — | **0** | **0** | ✅ PASS |
| Desktop Agent (`tsc`) | — | **0** | **0** | ✅ PASS |
| Mobile App (`tsc --noEmit`) | — | **0** | **0** | ✅ PASS |

> Note: The Next.js production build reports pre-existing webpack parse errors in `apps/web-app/src/app/institute/` (JSX in constant declarations outside component scope). These are unrelated to this sprint's changes and pre-date this work.

---

## Full File Change List

### New Files Created
| File | Description |
|---|---|
| `backend/src/main/java/com/kavach/sse/SseRegistry.java` | Thread-safe SSE connection registry |
| `backend/src/main/java/com/kavach/sse/SseController.java` | SSE endpoints for web app and desktop agent |
| `backend/src/main/resources/db/migration/V26__remove_demo_seed_data.sql` | Removes all demo tenant data |
| `backend/src/main/resources/application-prod.yml` | Production Spring Boot profile |
| `apps/web-app/src/hooks/useSSE.ts` | Reusable EventSource hook with auto-reconnect |
| `apps/mobile/env.example` | Mobile app environment variable template |

### Modified Files
| File | Change Summary |
|---|---|
| `backend/src/main/java/com/kavach/alerts/service/AlertEvaluationService.java` | Added SSE push after every alert save |
| `backend/src/main/java/com/kavach/blocking/service/BlockingService.java` | Added SSE push after rule create/toggle/delete |
| `backend/src/main/java/com/kavach/focus/service/FocusService.java` | Added SSE push for focus_start / focus_end |
| `backend/src/main/java/com/kavach/rules/RuleController.java` | Replaced WebSocket TODO with full SSE push on all mutations |
| `backend/src/main/java/com/kavach/security/SecurityConfig.java` | Whitelisted SSE device and health endpoints |
| `backend/src/main/java/com/kavach/ai/MoodController.java` | Renamed bean, moved to `/api/v1/ai/mood`, removed duplicate endpoints |
| `backend/src/main/java/com/kavach/ai/service/MoodService.java` | Renamed bean to `aiMoodService` |
| `backend/src/main/java/com/kavach/ai/service/MotivationService.java` | Updated import to `AiMoodCheckinRepository` |
| `backend/src/main/java/com/kavach/ai/entity/MoodCheckin.java` | Added `@Entity(name = "AiMoodCheckin")` to resolve JPA conflict |
| `backend/src/main/java/com/kavach/ai/repository/AiMoodCheckinRepository.java` | Renamed from `MoodCheckinRepository`; updated JPQL entity name |
| `backend/src/main/resources/db/migration/V24__location_geofences.sql` | Replaced with no-op to fix duplicate DDL production blocker |
| `backend/src/test/java/com/kavach/focus/service/FocusServiceTest.java` | Added `@Mock ChallengeService`, `@Mock SseRegistry` |
| `backend/src/test/java/com/kavach/alerts/service/AlertEvaluationServiceTest.java` | Added `@Mock SseRegistry`; fixed `eq()` matcher usage |
| `backend/src/test/java/com/kavach/blocking/service/BlockingServiceTest.java` | Added `@Mock EnforcementStateRepository`, `@Mock SseRegistry` |
| `backend/src/test/java/com/kavach/goals/service/GoalEvaluationServiceTest.java` | Fixed all `InvalidUseOfMatchers` with `eq()` |
| `backend/src/test/java/com/kavach/gamification/service/BadgeEvaluationServiceTest.java` | Fixed `InvalidUseOfMatchers` with `eq()` |
| `backend/env.example` | Added JWT, CORS, R2, Razorpay variables |
| `apps/web-app/src/hooks/useAlerts.ts` | Full rewrite — REST hydration + live SSE updates |
| `apps/web-app/src/hooks/useRules.ts` | No change (uses mock; SSE hook available for future wiring) |
| `apps/web-app/src/components/layout/TopBar.tsx` | Fixed missing `Link` import |
| `apps/web-app/src/app/parent/insights/page.tsx` | Fixed `null \| undefined` type error |
| `apps/web-app/env.example` | Added `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` |
| `apps/web-app/src/app/(auth)/login/page.tsx` | Gated demo credentials behind env flag |
| `apps/desktop-agent/src/enforcement/RuleSync.ts` | Added SSE subscription (`connectSse`) alongside 30 s poll |
| `apps/desktop-agent/src/enforcement/RuleSync.ts` | Fixed `UrlBlockRule` missing `id` field |
| `apps/desktop-agent/src/focus/focusEnforcer.ts` | Fixed `unknown` cast; fixed `window` guard |
| `apps/desktop-agent/src/screenshots/ScreenshotCapture.ts` | Fixed `unknown` → `ScreenshotSettings` cast |
| `apps/desktop-agent/src/blocking/blockingEngine.ts` | Fixed `unknown` → `AgentBlockRule[]` cast |
| `apps/desktop-agent/src/sync/deviceRegistration.ts` | Fixed `unknown` response casts |
| `apps/desktop-agent/src/__tests__/enforcementEngine.test.ts` | Fixed `RuleSync` constructor arity; updated `ruleType` field |
| `apps/desktop-agent/env.example` | Added `DEBUG=false` |
| `apps/mobile/src/screens/DashboardScreen.tsx` | Fixed import casing; removed invalid `background` CSS |
| `infra/nginx-config/nginx.conf` | Replaced `/ws/` WebSocket block with `/api/v1/sse/` SSE block |
| `docker-compose.yml` | Added R2 and Razorpay env vars to backend service |

---

*Generated: March 2026 | Kavach AI Engineering*
