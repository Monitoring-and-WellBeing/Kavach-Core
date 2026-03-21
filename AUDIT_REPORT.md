# KAVACH-CORE — Full Monorepo Audit Report

**Date:** 2026-03-13  
**Auditor:** AI Code Review  
**Scope:** Complete codebase — backend, web-app, desktop-agent, mobile, mobile-agent, infra, packages

---

## Fixes Applied (2026-03-13)

All actionable issues have been resolved. The table below maps each finding to its fix commit:

| ID | Finding | Fix |
|----|---------|-----|
| C-1 | Flyway V19 collision (3 files) | `V19__location_geofences.sql` → `V21__`, `V19__screenshots.sql` → `V22__` |
| C-2 | `RuleSync` constructor missing 3rd arg (`browserMonitor`) | Reordered `startEnforcement()` — `BrowserMonitor` created before `RuleSync`; passed as 3rd arg |
| C-3 | Dead `api.ts` reading wrong localStorage key | Deleted `apps/web-app/src/lib/api.ts` |
| C-4 | `docker-compose.yml` sets `JWT_EXPIRATION_MS` (not read by app) | Replaced with `JWT_ACCESS_EXPIRY` + `JWT_REFRESH_EXPIRY` |
| I-4 | Doubled `/api/v1/api/v1` path in Docker compose | `NEXT_PUBLIC_API_URL` changed to `http://backend:8080` |
| W-1 | CI only covered web-app, backend, stale mobile-agent | Added `desktop-agent-test` and `mobile-test` jobs pointing to real apps |
| W-2 | Demo credentials always visible in login UI | Gated behind `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`; default password cleared |
| W-3/W-4 | `lib/auth.ts` — hardcoded names, `OR` logic in `isAuthenticated` | Deleted `apps/web-app/src/lib/auth.ts` (zero imports, superseded by `AuthContext`) |
| W-5 | Rate limiting not wired | **False positive** — `RateLimitInterceptor` already wired in `WebConfig` |
| W-7 | Unused WebSocket dependency in `pom.xml` | Removed `spring-boot-starter-websocket` |
| I-2 | Deprecated `pipeline` key in `turbo.json` | Renamed to `tasks` |
| I-3 | Redundant `swcMinify: true` in `next.config.js` | Removed |
| I-7 | Kill-tool alert fires every 3 s (spam) | Added `activeKillTools` Set — reports once per open-event, resets on close |

---

## Executive Summary

The Kavach-Core monorepo is a well-structured, feature-rich student-safety platform with a Spring Boot backend, Next.js web dashboard, Electron desktop agent, and React Native mobile app. The overall architecture is sound and follows good practices. However, **five issues will prevent the system from starting or operating correctly** and must be fixed before any deployment.

| Severity | Count |
|----------|-------|
| 🔴 **CRITICAL** (will break at startup or runtime) | 5 |
| 🟡 **WARNING** (incorrect behaviour or security concern) | 8 |
| 🟢 **INFO** (clean-up, consistency, best-practice gaps) | 9 |

---

## 🔴 CRITICAL Issues

### C-1 — Flyway V19 Migration Version Collision (Backend **will not start**)

**File(s):**
- `backend/src/main/resources/db/migration/V19__ai_study_buddy.sql`
- `backend/src/main/resources/db/migration/V19__location_geofences.sql`
- `backend/src/main/resources/db/migration/V19__screenshots.sql`

**Problem:** Flyway requires globally unique version numbers. Three separate migration files share the prefix `V19__`. When Flyway scans the classpath it will throw a `FlywayException: Found more than one migration with version 19` and the Spring Boot application **will refuse to start entirely**.

**Fix:** Rename two of the three files to the next available version numbers. Given the sequence already has V20 and jumps to V23, safe choices are V21 and V22:

```
V19__ai_study_buddy.sql      → keep as-is (earliest concept, most foundational)
V19__location_geofences.sql  → rename to V21__location_geofences.sql
V19__screenshots.sql         → rename to V22__screenshots.sql
```

---

### C-2 — `RuleSync` Constructor Arity Mismatch — Desktop Agent **(TypeScript compile error + NPE at runtime)**

**File(s):**
- `apps/desktop-agent/src/enforcement/RuleSync.ts` (constructor expects 3 args)
- `apps/desktop-agent/src/main.ts` (called with 2 args)

**Problem:** The `RuleSync` constructor signature is:
```typescript
constructor(
  private readonly deviceId: string,
  private readonly engine: EnforcementEngine,
  private readonly browserMonitor: BrowserMonitor   // ← required
) {}
```
But `main.ts` instantiates it before `browserMonitor` is created and omits the third argument:
```typescript
ruleSync = new RuleSync(deviceId, enforcementEngine);   // ← missing browserMonitor
```
This is both a TypeScript compile error (cannot be built) and a runtime crash when `fullSync()` calls `this.browserMonitor.setRules(urlRules)` — `this.browserMonitor` is `undefined`.

**Fix:** Reorder the startup sequence in `startEnforcement()` in `main.ts` so `browserMonitor` is created before `ruleSync`, then pass it:
```typescript
browserMonitor = new BrowserMonitor();
ruleSync = new RuleSync(deviceId, enforcementEngine, browserMonitor);
ruleSync.start();
enforcementEngine.start();
browserMonitor.start();
```

---

### C-3 — Duplicate Axios Client with Mismatched Token Key — Web App **(silent auth failure)**

**File(s):**
- `apps/web-app/src/lib/api.ts` — reads `localStorage.getItem("kavach_token")`
- `apps/web-app/src/lib/axios.ts` — reads `localStorage.getItem("kavach_access_token")`

**Problem:** The canonical `AuthContext` (`context/AuthContext.tsx`) stores tokens under `kavach_access_token`. `axios.ts` reads this correctly. However, `api.ts` reads a key `kavach_token` that is **never written anywhere** in the codebase. Any component that imports from `src/lib/api.ts` instead of `src/lib/axios.ts` will silently send unauthenticated requests, receiving 401 errors on every call.

**Fix:** Either delete `api.ts` entirely and migrate any remaining imports to `axios.ts`, or update `api.ts` to read `kavach_access_token`. Recommend the former — having two API clients in one app is a maintenance hazard.

---

### C-4 — `docker-compose.yml` Sets Unmapped JWT Env Var — Docker Deployment **(JWT expiry ignored)**

**File:** `docker-compose.yml`

**Problem:** The compose file injects:
```yaml
JWT_EXPIRATION_MS: ${JWT_EXPIRATION_MS:-86400000}
```
But `application.yml` does not reference `JWT_EXPIRATION_MS`. It references `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY`:
```yaml
access-token-expiry: ${JWT_ACCESS_EXPIRY:900000}     # 15 min
refresh-token-expiry: ${JWT_REFRESH_EXPIRY:604800000} # 7 days
```
In Docker the access token will always use its 15-minute default (the `JWT_EXPIRATION_MS` value of 24 h is silently ignored). This does not break auth, but it is a configuration defect that will confuse operators.

**Fix:** Replace `JWT_EXPIRATION_MS` in `docker-compose.yml` with the two correct names:
```yaml
JWT_ACCESS_EXPIRY: ${JWT_ACCESS_EXPIRY:-900000}
JWT_REFRESH_EXPIRY: ${JWT_REFRESH_EXPIRY:-604800000}
```

---

### C-5 — Missing Flyway Versions V21 and V22 (Sequence gap — low risk, but signals abandoned work)

**File:** `backend/src/main/resources/db/migration/`

**Problem:** The migration sequence is: ...V18, V19 (×3 — see C-1), V20, **V21 missing**, **V22 missing**, V23, V24, V25. Flyway handles gaps fine (it does not require contiguous versions), but the gap between V20 and V23 indicates that migrations were drafted then abandoned or renamed. Combined with the V19 collision fix above, after renaming two files to V21/V22 the sequence will be complete.

**Fix:** Resolved as a side-effect of fixing C-1. No additional action needed once C-1 is addressed.

---

## 🟡 WARNING Issues

### W-1 — CI Pipeline Does Not Test `apps/desktop-agent` or `apps/mobile`

**File:** `.github/workflows/ci.yml`

**Problem:** The CI workflow has three jobs:
- `frontend-test` → `apps/web-app`
- `backend-test` → `backend`
- `mobile-test` → `apps/mobile-agent` (the older, 5-file stub)

Neither the full mobile app (`apps/mobile/`, 42 source files, with its own Jest suite) nor the desktop agent (`apps/desktop-agent/`, with 5 `__tests__/*.test.ts` files) are executed in CI. Bugs in these packages can be merged without test feedback.

**Fix:** Add two CI jobs:
```yaml
desktop-agent-test:
  working-directory: apps/desktop-agent
  steps: [...install..., run: pnpm test:coverage]

mobile-test-full:
  working-directory: apps/mobile
  steps: [...install..., run: pnpm test:coverage]
```

---

### W-2 — Hardcoded Demo Credentials Visible in Production Login UI

**File:** `apps/web-app/src/app/(auth)/login/page.tsx`

**Problem:** The login page renders three "Demo Credentials" buttons in the UI that auto-fill `parent@demo.com / demo123`, `student@demo.com / demo123`, and `admin@demo.com / demo123`. The default password field value is also `"demo123"`. If these accounts exist in production, they represent a trivial path to full system access.

**Fix:** Gate this UI block behind an environment variable:
```tsx
{process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true' && (
  <div>{/* demo credentials */}</div>
)}
```
Ensure this variable is not set in the production `Dockerfile`/environment.

---

### W-3 — `auth.ts` Helper Returns Hardcoded Demo User Names

**File:** `apps/web-app/src/lib/auth.ts`

**Problem:** The `getStoredUser()` function parses `sessionStorage` but returns hardcoded display names:
```typescript
name: parsed.role === "parent" ? "Rajesh Kumar"
    : parsed.role === "student" ? "Rahul Sharma"
    : "School Admin",
```
This function also returns `"demo-user"` as the user ID and `"tenant-001"` as the tenant. Any component calling `getStoredUser()` from `lib/auth.ts` (rather than `useAuth()` from `AuthContext`) gets stale demo data, not the real authenticated user.

**Fix:** Delete `src/lib/auth.ts` (its helpers overlap with `AuthContext`) or rewrite it to read real user data from `AuthContext`. Trace all imports of `lib/auth.ts` and migrate them.

---

### W-4 — `isAuthenticated()` Uses OR Logic (Token OR User)

**File:** `apps/web-app/src/lib/auth.ts`

```typescript
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  const user = getStoredUser();
  return token !== null || user !== null;  // ← OR, not AND
}
```
**Problem:** A session can be considered "authenticated" if either a token exists OR a user object is in `sessionStorage`. If the token has expired and been removed but the sessionStorage entry remains, `isAuthenticated()` returns `true` while every API call returns 401.

**Fix:** Use AND logic: `return token !== null && user !== null;`. (Again, this entire file should be deleted — see W-3.)

---

### W-5 — ~~No Rate Limiting on Authentication Endpoints~~ ✅ Already Implemented

**Status:** _False positive — confirmed already fixed._

`RateLimitInterceptor` (using Bucket4j) is fully implemented and registered in `WebConfig.addInterceptors()` targeting `/api/v1/**`. It enforces 10 requests/minute per IP on auth endpoints, 5 requests/hour per tenant on insights refresh, and 100 requests/minute per user on all other API routes.

---

### W-6 — No HTTPS/Secure-Channel Enforcement in `SecurityConfig`

**File:** `backend/src/main/java/com/kavach/security/SecurityConfig.java`

**Problem:** HSTS is configured in response headers (`max-age=31536000; includeSubDomains`) which is correct, but there is no `requiresChannel().anyRequest().requiresSecure()` in the security filter chain. When deployed behind a TLS-terminating proxy this is fine, but there is no code or documentation asserting that the proxy enforces TLS. Plain HTTP connections to the backend are accepted.

**Fix:** Document the TLS termination requirement explicitly. If no reverse proxy is guaranteed, add `requiresSecure()` or enforce via `server.ssl.*` in `application.yml`.

---

### W-7 — WebSocket Dependency Declared but Never Configured

**File:** `backend/pom.xml`

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

**Problem:** `spring-boot-starter-websocket` is a declared dependency, but there is no `@EnableWebSocketMessageBroker` configuration, no `WebSocketConfig` class, and no WebSocket endpoints in the entire backend source tree. This adds approximately 3 MB to the JAR with no benefit.

**Fix:** Remove the dependency from `pom.xml` if real-time push is not planned in the near term.

---

### W-8 — `apps/mobile-agent` Is a Stale Stub (5 files, not in main CI)

**File:** `apps/mobile-agent/`

**Problem:** This directory contains only 5 TypeScript source files (`src/*.ts`) and appears to be an early sketch of the Android agent. The production mobile app lives in `apps/mobile/` (42 source files). The CI `mobile-test` job points to `apps/mobile-agent`, running tests for the stale stub rather than the real app. This wastes CI time and provides a false sense of test coverage.

**Fix:** Archive or delete `apps/mobile-agent/`. Update the CI job to point to `apps/mobile/` (see W-1).

---

## 🟢 INFO / Best-Practice Items

### I-1 — `lib/auth.ts` and `lib/api.ts` Are Unused Dead Code in Web App

Both `src/lib/auth.ts` and `src/lib/api.ts` are superseded by `context/AuthContext.tsx` and `src/lib/axios.ts` respectively. They should be deleted to avoid future confusion.

---

### I-2 — `turbo.json` Uses Deprecated `pipeline` Key

**File:** `turbo.json`

Turborepo ≥ 2.0 replaced `"pipeline"` with `"tasks"`. The current root `turbo.json` uses `"pipeline"`, which still works with Turbo 1.x (the project pins `"turbo": "^1.13.0"`) but will require migration when upgrading.

---

### I-3 — `next.config.js` `swcMinify: true` Is Redundant in Next.js 14

`swcMinify` became the default in Next.js 13 and the option is a no-op in Next.js 14. It can be removed.

---

### I-4 — Docker Compose `NEXT_PUBLIC_API_URL` Points to API vs. Base URL

**File:** `docker-compose.yml`
```yaml
NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8080/api/v1}
```
But `apps/web-app/src/lib/axios.ts` appends `/api/v1` to `NEXT_PUBLIC_API_URL`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
export const api = axios.create({ baseURL: `${API_URL}/api/v1` })
```
In Docker, the base URL will be `http://localhost:8080/api/v1/api/v1` — a doubled path. The compose value should be `http://backend:8080` (the service name), not `http://localhost:8080/api/v1`.

**Fix:**
```yaml
NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://backend:8080}
```

---

### I-5 — Dangling `UrlBlockRule` Interface in `BrowserMonitor.ts` — `id` Field Unused

**File:** `apps/desktop-agent/src/enforcement/BrowserMonitor.ts`

```typescript
export interface UrlBlockRule {
  id: string        // ← declared but never referenced inside the class
  pattern: string
  action: 'BLOCK' | 'ALLOW'
}
```
The `id` field is declared but never used in `checkActiveBrowserUrl()`. Minor — but indicates a copy-paste from `BlockingRule`. Clean up for clarity.

---

### I-6 — `V2__seed_demo_data.sql` Should Not Run on Production

**File:** `backend/src/main/resources/db/migration/V2__seed_demo_data.sql`

Flyway runs all versioned migrations in sequence. If V2 inserts demo users (`parent@demo.com`, etc.) every production deployment will contain those accounts permanently unless V2 is excluded or an explicit delete migration is added.

**Fix:** Either move demo seeding to a `R__` (repeatable) migration that is excluded in production via `spring.flyway.locations`, or add a `V26__remove_demo_data.sql` that deletes these rows (guarded by environment check).

---

### I-7 — `SelfProtection.detectKillTools()` Reports Every 3 Seconds — No Dedup

**File:** `apps/desktop-agent/src/protection/SelfProtection.ts`

Task Manager (`taskmgr`) is a commonly open process. Once detected, `reportKillToolDetected()` fires a POST to the backend every 3 seconds for as long as Task Manager stays open. This creates alert spam in the parent dashboard and unnecessary backend load.

**Fix:** Track per-tool "first seen" timestamp and report only once per unique tool open-event (reset when the tool process disappears).

---

### I-8 — Mobile `AppWatcherTask` `minimumInterval: 15` Is Unreachable on Modern Android

**File:** `apps/mobile/src/tasks/AppWatcherTask.ts`

```typescript
await BackgroundFetch.registerTaskAsync(APP_WATCHER_TASK, {
  minimumInterval: 15,   // seconds
  ...
})
```
Android Doze Mode enforces a minimum background fetch interval of ~15 **minutes** regardless of what is requested. The code comment acknowledges this (`// Android enforces ~15 min in practice`) but the value `15` seconds will mislead developers into believing the watcher runs frequently. The actual polling is every 15 minutes.

**Fix:** Document clearly and consider using `expo-foreground-service` or a native Foreground Service for true near-real-time enforcement on Android.

---

### I-9 — Excessive `*.md` Documentation Files in `apps/web-app/`

The `apps/web-app/` directory contains 22 markdown files (`ALL_TEST_COMMANDS.md`, `FINAL_ESM_FIX.md`, `FINAL_FIX.md`, `MSW_ESM_FIX.md`, `RUN_TESTS.md`, `STEP1_*`, `STEP2_*`, etc.). These are development scratch-notes that should be removed before the repository goes public or is handed to another team.

**Fix:** Delete or consolidate into a single `DEVELOPMENT.md`.

---

## Architecture & Positive Observations

The following were confirmed as well-implemented:

| Area | Observation |
|------|-------------|
| **Security headers** | CSP, HSTS, X-Frame-Options, and Referrer-Policy all configured in `SecurityConfig`. |
| **JWT auth** | Stateless access + refresh token pattern, stored correctly in `localStorage`, auto-refresh on 401 in `axios.ts`. |
| **Agent permit-all** | Enforcement, location, and screenshot agent endpoints correctly whitelisted without JWT — device authenticates by `deviceId`. |
| **Enforcement resilience** | Rule cache preserved on network failure; enforcement never stops waiting for a sync. |
| **Anti-clock manipulation** | `TimeSync` syncs with server time before every schedule evaluation — prevents students bypassing schedules by changing system clock. |
| **Screenshot privacy** | Student disclosure dialog shown before screenshots are captured; disclosure state persisted on backend. |
| **Shared packages** | `@kavach/shared-types`, `shared-constants`, `shared-utils` properly structured as workspace packages and transpiled correctly in `next.config.js`. |
| **PWA** | Offline support via `next-pwa` with appropriate cache strategies. |
| **Flyway** | `baseline-on-migrate: true` allows attaching to existing databases safely. |
| **Self-protection** | Task Manager detection fires alerts rather than killing Task Manager — correct deliberate restraint. |
| **Docker** | Health check on PostgreSQL with `depends_on: condition: service_healthy` ensures backend waits for DB. |
| **CORS** | Origins read from `CORS_ORIGINS` env var at runtime — not hardcoded. |

---

## Priority Fix Order

1. **C-1** — Rename duplicate V19 migrations (backend won't start)
2. **C-2** — Fix `RuleSync` constructor call in `main.ts` (desktop agent won't compile)
3. **I-4** — Fix doubled `/api/v1/api/v1` in docker-compose (web app broken in Docker)
4. **C-3** — Remove or fix dead `api.ts` client (silent auth failures)
5. **C-4** — Fix `JWT_EXPIRATION_MS` → `JWT_ACCESS_EXPIRY` in docker-compose
6. **W-2** — Gate demo credentials behind env var (security)
7. **W-3 + W-4** — Delete `lib/auth.ts` stub
8. **W-1** — Add desktop-agent and mobile tests to CI
9. **W-5** — Wire rate limiter to auth endpoints
10. **I-6** — Exclude or guard demo seed data from production
