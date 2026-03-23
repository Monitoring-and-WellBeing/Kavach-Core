# KAVACH AI — Prompt 12: Unified Rule Enforcement Engine

> **Thread completed:** March 2026  
> **Scope:** `backend/` · `apps/desktop-agent/` · `apps/mobile/`  
> **Mission:** Make the backend the single source of truth for all rules. Both the desktop agent (Electron/Windows) and the Android app (React Native) pull from the same rule set, enforce within their own capabilities, and report violations to the same log. A parent sets **one rule** — both devices enforce it.

---

## Table of Contents

1. [What Was Built](#1-what-was-built)
2. [Architecture Overview](#2-architecture-overview)
3. [Part 1 — Backend: Time Limit Tracker](#3-part-1--backend-time-limit-tracker)
4. [Part 2 — Desktop Agent: Unified Rule Sync](#4-part-2--desktop-agent-unified-rule-sync)
5. [Part 3 — Android App: Rule-Aware Watcher](#5-part-3--android-app-rule-aware-watcher)
6. [Part 4 — Cross-Platform Enforcement Matrix](#6-part-4--cross-platform-enforcement-matrix)
7. [Part 5 — Rules Version Invalidation](#7-part-5--rules-version-invalidation)
8. [File-by-File Change Log](#8-file-by-file-change-log)
9. [API Reference — New Endpoints](#9-api-reference--new-endpoints)
10. [Database Schema — New Tables](#10-database-schema--new-tables)
11. [Design Decisions & Problem Solving](#11-design-decisions--problem-solving)
12. [Completion Checklist](#12-completion-checklist)

---

## 1. What Was Built

Before this prompt, KAVACH had two independent silos:

| Component | State Before |
|---|---|
| Desktop Agent | Fetched rules from `/blocking/rules/device/{id}` — blocking only |
| Android App | Had no rule sync at all — overlay was not rule-aware |
| Backend | No cross-platform usage tracking, no time limits, no shared enforcement state |

After this prompt, **every rule set by a parent is enforced on all linked devices within 30 seconds** (or instantly via silent push). Usage from both devices is counted together for time limit calculations.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    KAVACH BACKEND                           │
│                                                             │
│  enforcement_state table  ←─── incremented on every rule   │
│  (rules_version per device)      change by BlockingService  │
│                                                             │
│  GET  /enforcement/state/{id}  ──→ unified enforcement DTO  │
│  GET  /enforcement/version/{id} ─→ lightweight version int  │
│  POST /enforcement/usage        ─→ accumulate daily usage   │
│  POST /enforcement/events       ─→ violation log            │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
         30s poll │ + SSE push    30s poll│ + silent push
                  ▼                       ▼
   ┌──────────────────────┐   ┌───────────────────────────┐
   │  DESKTOP AGENT       │   │  ANDROID APP              │
   │  (Electron/Windows)  │   │  (React Native)           │
   │                      │   │                           │
   │  RuleSync.ts         │   │  RuleSync.ts              │
   │  EnforcementEngine   │   │  AppWatcherTask.ts        │
   │  UsageTracker.ts     │   │  AsyncStorage cache       │
   │                      │   │                           │
   │  Every 2s:           │   │  Every 15s:               │
   │  • Kill blocked apps │   │  • Show red overlay       │
   │  • Kill at time limit│   │  • Show blue/amber overlay│
   │  • Kill focus violat.│   │  • Time limit warning     │
   │                      │   │                           │
   │  Every 5 min:        │   │  Every 5 min:             │
   │  • POST /usage       │   │  • POST /usage            │
   │    platform: WINDOWS │   │    platform: ANDROID      │
   └──────────────────────┘   └───────────────────────────┘
```

**Key principle:** Usage from both platforms is **accumulated in the same `daily_app_usage` row** (unique per `device_id + date + category + package`). So 30 minutes of gaming on the PC + 30 minutes on the phone = **60 minutes counted against the daily gaming limit** — on both devices simultaneously.

---

## 3. Part 1 — Backend: Time Limit Tracker

### 3.1 Database Migration — `V25__time_limit_enforcement.sql`

**File:** `backend/src/main/resources/db/migration/V25__time_limit_enforcement.sql`

Three new tables and two `ALTER TABLE` changes to `enforcement_events`:

#### `daily_app_usage`
Cross-platform usage accumulator. Both the desktop agent and Android app write to this table every 5 minutes.

```sql
CREATE TABLE IF NOT EXISTS daily_app_usage (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id        UUID        NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    usage_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
    app_category     VARCHAR(50) NOT NULL,   -- GAMING, SOCIAL, ENTERTAINMENT, etc.
    package_name     VARCHAR(255),           -- specific app (optional)
    duration_seconds INTEGER     NOT NULL DEFAULT 0,
    last_updated     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (device_id, usage_date, app_category, COALESCE(package_name, ''))
);
```

- `UNIQUE` constraint prevents double-counting. On conflict, `recordUsage()` finds the existing row and adds to it.
- Indexed on `(device_id, usage_date DESC)` and `(tenant_id, usage_date DESC)` for fast daily lookups.

#### `time_limit_rules`
Parent-set soft daily limits per category or specific app. Distinct from hard block rules — these allow the app up to the limit, then block.

```sql
CREATE TABLE IF NOT EXISTS time_limit_rules (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_id            UUID        REFERENCES devices(id) ON DELETE CASCADE,  -- NULL = all devices
    app_category         VARCHAR(50),           -- GAMING, SOCIAL, ENTERTAINMENT, EDUCATION
    package_name         VARCHAR(255),          -- specific app (overrides category if set)
    daily_limit_seconds  INTEGER     NOT NULL,
    warning_at_seconds   INTEGER,               -- warn at this usage (e.g. 80% of limit)
    schedule_days        INTEGER[],             -- 0=Sun … 6=Sat, NULL=all days
    schedule_start       TIME,
    schedule_end         TIME,
    active               BOOLEAN     NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `device_id = NULL` means the rule applies to **all devices** in the tenant.
- `package_name` takes precedence over `app_category` when both are set.
- `warning_at_seconds` triggers a warning notification/alert before the hard limit is hit.

#### `enforcement_state`
Per-device cache of the current enforcement version and focus mode state. This is the **version counter** that drives efficient rule sync.

```sql
CREATE TABLE IF NOT EXISTS enforcement_state (
    device_id          UUID        PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    rules_version      INTEGER     NOT NULL DEFAULT 0,
    focus_mode_active  BOOLEAN     NOT NULL DEFAULT false,
    focus_session_id   UUID        REFERENCES focus_sessions(id) ON DELETE SET NULL,
    focus_ends_at      TIMESTAMPTZ,
    last_synced        TIMESTAMPTZ
);
```

- `rules_version` is incremented atomically every time a rule is created, toggled, or deleted.
- Both clients cache this version and only do a full re-fetch when it changes.

#### `enforcement_events` — ALTER TABLE
```sql
ALTER TABLE enforcement_events
    ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'WINDOWS';
```
Added a `platform` column so the parent's alerts feed can show whether a violation came from the desktop or the phone.

New `action` values added to the CHECK constraint:
- `APP_BLOCKED` — app was blocked (new explicit action name)
- `FOCUS_VIOLATION` — app opened during a focus session
- `TIME_LIMIT_REACHED` — app blocked because daily limit was exceeded

---

### 3.2 JPA Entities

#### `DailyAppUsage.java`
**File:** `backend/src/main/java/com/kavach/enforcement/entity/DailyAppUsage.java`

```java
@Entity
@Table(name = "daily_app_usage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyAppUsage {
    @Id @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    private UUID deviceId;
    private UUID tenantId;

    @Builder.Default
    private LocalDate usageDate = LocalDate.now();
    private String appCategory;
    private String packageName;

    @Builder.Default
    private int durationSeconds = 0;

    @Builder.Default
    private Instant lastUpdated = Instant.now();
}
```

#### `TimeLimitRule.java`
**File:** `backend/src/main/java/com/kavach/enforcement/entity/TimeLimitRule.java`

Includes `Integer[] scheduleDays` mapped with `@JdbcTypeCode(SqlTypes.ARRAY)` to match the PostgreSQL `integer[]` column. Defaults for `active = true` and `createdAt = Instant.now()` use `@Builder.Default`.

#### `EnforcementState.java`
**File:** `backend/src/main/java/com/kavach/enforcement/entity/EnforcementState.java`

Simple entity with `deviceId` as `@Id` (no generated key — it's the foreign key to `devices`). Defaults `rulesVersion = 0` and `focusModeActive = false` via `@Builder.Default`.

---

### 3.3 Repositories

#### `DailyAppUsageRepository.java`
**File:** `backend/src/main/java/com/kavach/enforcement/repository/DailyAppUsageRepository.java`

Key custom queries:

```java
// Used by TimeLimitService.recordUsage() to find-or-create the row
@Query("SELECT d FROM DailyAppUsage d WHERE d.deviceId = :deviceId " +
       "AND d.usageDate = :usageDate AND d.appCategory = :appCategory " +
       "AND (:packageName IS NULL OR d.packageName = :packageName)")
Optional<DailyAppUsage> findByDeviceIdAndDateAndCategoryAndPackage(...);

// Used by TimeLimitService.getStatus() to calculate remaining time
@Query("SELECT COALESCE(SUM(d.durationSeconds), 0) FROM DailyAppUsage d " +
       "WHERE d.deviceId = :deviceId AND d.usageDate = CURRENT_DATE " +
       "AND (:appCategory IS NULL OR d.appCategory = :appCategory) " +
       "AND (:packageName IS NULL OR d.packageName = :packageName)")
int getTodayUsage(...);
```

#### `TimeLimitRuleRepository.java`
**File:** `backend/src/main/java/com/kavach/enforcement/repository/TimeLimitRuleRepository.java`

```java
// Used by getStatus() — returns all rules that apply to a device
// (device-specific rules AND tenant-wide rules where device_id IS NULL)
@Query("SELECT r FROM TimeLimitRule r WHERE r.active = true " +
       "AND r.tenantId = :tenantId " +
       "AND (r.deviceId = :deviceId OR r.deviceId IS NULL)")
List<TimeLimitRule> findActiveRulesForDevice(...);

// Used by checkTimeLimits() — finds rules matching a specific category/app
@Query("SELECT r FROM TimeLimitRule r WHERE r.active = true " +
       "AND r.tenantId = :tenantId " +
       "AND (r.deviceId = :deviceId OR r.deviceId IS NULL) " +
       "AND (:category IS NULL OR r.appCategory = :category) " +
       "AND (:packageName IS NULL OR r.packageName = :packageName)")
List<TimeLimitRule> findByDeviceAndCategory(...);
```

#### `EnforcementStateRepository.java`
**File:** `backend/src/main/java/com/kavach/enforcement/repository/EnforcementStateRepository.java`

```java
// Returns the current rules version (0 if no state row exists yet)
default int getVersion(UUID deviceId) {
    return findById(deviceId).map(EnforcementState::getRulesVersion).orElse(0);
}

// Atomically increments the version for a single device
@Modifying
@Transactional
@Query(value = """
    INSERT INTO enforcement_state (device_id, rules_version)
    VALUES (:deviceId, 1)
    ON CONFLICT (device_id) DO UPDATE
      SET rules_version = enforcement_state.rules_version + 1,
          last_synced   = NOW()
    """, nativeQuery = true)
void incrementVersion(@Param("deviceId") UUID deviceId);

// Tenant-wide increment (when a rule applies to all devices)
@Modifying
@Transactional
@Query(value = """
    INSERT INTO enforcement_state (device_id, rules_version)
    SELECT d.id, 1 FROM devices d
    WHERE d.tenant_id = :tenantId AND d.is_active = true
    ON CONFLICT (device_id) DO UPDATE
      SET rules_version = enforcement_state.rules_version + 1,
          last_synced   = NOW()
    """, nativeQuery = true)
void incrementVersionForTenant(@Param("tenantId") UUID tenantId);
```

The `ON CONFLICT ... DO UPDATE` pattern means no explicit "check if row exists" is needed — the upsert is atomic and race-condition safe.

---

### 3.4 DTOs

#### `TimeLimitEntryDto.java`
Per-rule status: used seconds, remaining seconds, whether the limit is reached, whether the warning threshold has been crossed.

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TimeLimitEntryDto {
    private UUID    ruleId;
    private String  appCategory;
    private String  packageName;
    private int     dailyLimitSeconds;
    private int     usedSeconds;
    private int     remainingSeconds;
    private boolean limitReached;
    private boolean warningThreshold;
}
```

#### `TimeLimitStatusDto.java`
Wrapper around the list of entries, includes the device ID and date for the client to confirm freshness.

#### `EnforcementStateDto.java`
The single unified response that both clients receive from `/enforcement/state/{id}`:

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EnforcementStateDto {
    private List<AgentBlockRuleDto> blockingRules;   // all active block rules
    private TimeLimitStatusDto      timeLimitStatus; // today's usage + remaining
    private boolean                 focusModeActive;
    private Instant                 focusEndsAt;
    private List<String>            focusWhitelist;  // allowed apps during focus
    private int                     rulesVersion;    // change-detection integer
}
```

#### `UsageReportDto.java`
Payload sent by both clients to `POST /enforcement/usage`:

```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UsageReportDto {
    @NotNull   private UUID   deviceId;
    @NotBlank  private String appCategory;
               private String packageName;
               private int    durationSeconds;
    @NotBlank  private String platform;    // WINDOWS | ANDROID
}
```

---

### 3.5 `TimeLimitService.java`
**File:** `backend/src/main/java/com/kavach/enforcement/service/TimeLimitService.java`

Three responsibilities:

**`recordUsage()`** — Called by `POST /enforcement/usage`. Finds the existing `daily_app_usage` row (or creates it), adds the reported seconds, saves, then immediately calls `checkTimeLimits()`.

**`getStatus()`** — Called inside `GET /enforcement/state/{id}`. Loads all active rules for the device, queries today's usage for each, calculates `remainingSeconds` and flags `limitReached` / `warningThreshold`.

**`checkTimeLimits()`** — Private. After each usage update, checks if any thresholds have been crossed and creates `Alert` rows that are surfaced to the parent's alerts feed with severity `LOW` (warning) or `MEDIUM` (limit reached).

---

### 3.6 `EnforcementStateController.java`
**File:** `backend/src/main/java/com/kavach/enforcement/EnforcementStateController.java`

All three endpoints are permit-all (no JWT required) — clients authenticate implicitly via `deviceId`.

```
GET  /api/v1/enforcement/state/{deviceId}
GET  /api/v1/enforcement/version/{deviceId}
POST /api/v1/enforcement/usage
```

See [Section 9 — API Reference](#9-api-reference--new-endpoints) for full request/response details.

---

### 3.7 `EnforcementEventDto.java` + `EnforcementEvent.java` — Updated

**File:** `backend/src/main/java/com/kavach/enforcement/dto/EnforcementEventDto.java`
**File:** `backend/src/main/java/com/kavach/enforcement/entity/EnforcementEvent.java`

Added `private String platform; // WINDOWS | ANDROID` to both the DTO (with `@NotBlank`) and the entity (with `@Column(nullable = false, length = 50)`).

`EnforcementService.java` updated to persist the new field:
```java
EnforcementEvent event = EnforcementEvent.builder()
    // ... existing fields ...
    .platform(dto.getPlatform())
    .build();
```

---

### 3.8 `BlockingService.java` — Updated
**File:** `backend/src/main/java/com/kavach/blocking/service/BlockingService.java`

`EnforcementStateRepository` injected. Every method that mutates rules now increments the version:

- `createRule()` → `updateDeviceRulesTimestamp()` → `incrementVersion(deviceId)` or `incrementVersionForTenant(tenantId)`
- `toggleRule()` → same
- `deleteRule()` → same

This ensures that within milliseconds of a parent saving a rule change, both clients' next version poll sees a changed number and triggers a full re-fetch.

---

### 3.9 `SecurityConfig.java` — Updated
**File:** `backend/src/main/java/com/kavach/security/SecurityConfig.java`

Added the three new enforcement endpoints to the permit-all list:

```java
"/api/v1/enforcement/state/**",
"/api/v1/enforcement/usage",
"/api/v1/enforcement/version/**",
```

---

## 4. Part 2 — Desktop Agent: Unified Rule Sync

### 4.1 `RuleSync.ts` — Replaced
**File:** `apps/desktop-agent/src/enforcement/RuleSync.ts`

Completely replaced the old version (which only fetched from `/blocking/rules/device/{id}`) with a unified implementation that:

**Startup sequence:**
1. `fullSync()` called immediately — rules loaded before the first enforcement cycle
2. `connectSse()` — establishes an SSE connection to `/api/v1/sse/device/{id}` for instant rule push
3. `setInterval(syncIfChanged, 30_000)` — version-based fallback polling every 30 seconds
4. `setInterval(reportUsage, 5 * 60_000)` — usage reporting every 5 minutes

**SSE events handled:**
- `rules_updated` → immediate `fullSync()`
- `focus_start` → immediate `fullSync()`
- `focus_end` → immediate `fullSync()`
- On SSE error → reconnects after 10 seconds (exponential backoff)

**`syncIfChanged()`:**
```
GET /enforcement/version/{deviceId}
  → version same as cached? → skip
  → version changed? → fullSync()
```

**`fullSync()`:**
```
GET /enforcement/state/{deviceId}
  → engine.setRules(blockingRules)
  → engine.setTimeLimits(timeLimitStatus)
  → engine.setFocusMode(focusModeActive, focusWhitelist)
  → browserMonitor.setRules(urlRules)
  → cache currentState + lastVersion
```

**`reportUsage()`:**
```
UsageTracker.getAndReset()
  → for each [processName, seconds] where seconds >= 10:
      POST /enforcement/usage { platform: 'WINDOWS', ... }
```

**Rule type mapping** — backend uses `APP`, `CATEGORY`, `WEBSITE`, `KEYWORD`; engine uses `BLOCK_APP`, `BLOCK_URL`, `FOCUS_MODE`, `TIME_LIMIT`. `mapRuleType()` handles the translation.

**Resilience:** On any network failure, `fullSync()` logs the error but does **not** clear the current state — enforcement continues with the last known rules.

---

### 4.2 `EnforcementEngine.ts` — Updated
**File:** `apps/desktop-agent/src/enforcement/EnforcementEngine.ts`

**New exported types** (moved here to break circular dependency with `RuleSync.ts`):

```typescript
export interface BlockingRule { ... }
export interface TimeLimitEntry { ... }
export interface TimeLimitStatus { ... }
```

**New private state:**
```typescript
private timeLimits: TimeLimitStatus = { entries: [] }
private focusModeActive = false
private focusWhitelist: string[] = []
```

**New public setters:**
```typescript
setTimeLimits(status: TimeLimitStatus): void
setFocusMode(active: boolean, whitelist: string[]): void
```

**Updated `enforce()` loop:**
```typescript
private async enforce() {
    const activeProcesses = await this.getActiveProcesses()
    const foreground = activeProcesses[0]?.name || null
    if (foreground) activeAppUsage.update(foreground)  // ← NEW

    // existing: block rules
    for (const rule of this.rules) { ... }

    // NEW: time limit enforcement
    await this.enforceTimeLimits(activeProcesses)

    // NEW: focus mode enforcement
    await this.enforceFocusMode(activeProcesses)
}
```

**`enforceTimeLimits()`:**
- For each running process, calls `getTimeLimitForProcess()` to find a matching rule
- If `limitReached` → calls `killProcess()` (same mechanism as block rules) + `showTimeLimitNotification()`
- If `warningThreshold` → calls `showTimeLimitWarning()` (deduplicated via `killCooldown` map — only shows once per threshold per session)

**`enforceFocusMode()`:**
- If `focusModeActive` is false → returns immediately (no-op)
- For each running process, checks if it's in `focusWhitelist` (case-insensitive partial match)
- If not whitelisted → `killProcess()` with synthetic rule `{ id: 'focus-mode', type: 'FOCUS_MODE' }`

**Windows notifications (Electron API):**
```typescript
// Time limit reached:
new Notification({ title: 'Time Limit Reached — KAVACH',
    body: `Daily ${category} limit reached. ${appName} has been closed.` }).show()

// Warning (e.g. 10 min left):
new Notification({ title: 'Time Limit Warning — KAVACH',
    body: `${remainingMins} minutes remaining for ${appName} today.` }).show()
```

---

### 4.3 `UsageTracker.ts` — New File
**File:** `apps/desktop-agent/src/enforcement/UsageTracker.ts`

Tracks how long each process is in the foreground between reporting cycles.

```typescript
export class UsageTracker {
    private usageAccumulator = new Map<string, number>()  // process → total ms
    private lastActiveProcess: string | null = null
    private lastCheckTime = Date.now()

    update(currentProcess: string): void {
        const elapsed = Date.now() - this.lastCheckTime
        if (this.lastActiveProcess) {
            const prev = this.usageAccumulator.get(this.lastActiveProcess) || 0
            this.usageAccumulator.set(this.lastActiveProcess, prev + elapsed)
        }
        this.lastActiveProcess = currentProcess
        this.lastCheckTime = Date.now()
    }

    getAndReset(): Record<string, number> {
        // Returns { "valorant.exe": 180, "chrome.exe": 120 } (seconds)
        // Clears the accumulator for the next window
    }
}

export const activeAppUsage = new UsageTracker()
```

`update()` is called at the top of every 2-second enforcement cycle with the current foreground process name. `getAndReset()` is called every 5 minutes by `RuleSync.reportUsage()`.

---

## 5. Part 3 — Android App: Rule-Aware Watcher

### 5.1 `RuleSync.ts` — New File
**File:** `apps/mobile/src/enforcement/RuleSync.ts`

A singleton service that manages the enforcement state for the Android app:

```typescript
export const RuleSync = new RuleSyncService()
```

**Lifecycle:**
```
RuleSync.start(deviceId)
  1. loadCachedState()        — read AsyncStorage, works offline
  2. NetInfo.fetch()          — check connectivity
  3. fullSync() if online     — load fresh state from backend
  4. setInterval(poll, 30s)   — version-based background polling

RuleSync.stop()               — clears interval, nulls deviceId

RuleSync.triggerSync()        — immediate fullSync() for silent push handler
```

**State accessors (called by `AppWatcherTask`):**

| Method | Returns | Used for |
|---|---|---|
| `getState()` | `EnforcementState \| null` | Raw state access |
| `isAppBlocked(packageName)` | `BlockingRule \| null` | Hard block check |
| `getTimeLimitForApp(packageName)` | `TimeLimitEntry \| null` | Time limit check |
| `isFocusModeActive()` | `boolean` | Focus mode check (also validates `focusEndsAt`) |
| `isWhitelistedDuringFocus(packageName)` | `boolean` | Whitelist check |
| `onStateChange(listener)` | `void` | Subscribe to state updates |

**Offline resilience:**
- State is persisted to `AsyncStorage` key `kavach_enforcement_state` on every successful sync
- `rules_version` cached separately at key `kavach_rules_version`
- On startup, cached state is loaded immediately — the watcher can enforce rules even if the device has never connected to the backend since the last sync

**`categorizeAndroid(packageName)`:**  
Maps Android package names to the same category strings used by the backend time limit rules:
- `com.supercell.*`, `com.roblox.*`, `com.mojang.*` → `GAMING`
- `com.instagram.*`, `com.snapchat.*`, `com.whatsapp.*` → `SOCIAL`
- `com.google.android.youtube`, `com.netflix.*` → `ENTERTAINMENT`
- Everything else → `OTHER`

---

### 5.2 `AppWatcherTask.ts` — Replaced
**File:** `apps/mobile/src/tasks/AppWatcherTask.ts`

Completely replaced with a rule-aware unified version. Runs every 15 seconds as a background task via `expo-background-fetch`.

**The check sequence (per 15-second cycle):**

```
1. Get current foreground app (Android UsageStatsManager)
2. Accumulate 15s of usage in usageBuffer map
3. RuleSync.isAppBlocked(currentApp)?
       YES → showRuleAwareOverlay() [RED]  + reportViolation(APP_BLOCKED)
       → return NewData
4. RuleSync.isFocusModeActive() && !isWhitelistedDuringFocus()?
       YES → showFocusModeOverlay() [BLUE] + reportViolation(FOCUS_VIOLATION)
       → return NewData
5. RuleSync.getTimeLimitForApp(currentApp)?
       .limitReached → showTimeLimitOverlay() [AMBER] + reportViolation(TIME_LIMIT_REACHED)
       .warningThreshold → showTimeLimitWarning() [quiet notification]
6. Every 20 cycles (~5 min): flushUsageBuffer() → POST /enforcement/usage
```

**Overlay differentiation (color-coded):**

| Scenario | Overlay Color | Title |
|---|---|---|
| Hard blocked app | Red `#EF4444` | "App is blocked" |
| Focus mode violation | Blue `#2563EB` | "🎯 Focus Mode is ON" |
| Time limit reached | Amber `#F59E0B` | "Daily Limit Reached" |
| Time limit warning | No overlay — local notification | "⏱ Time Limit Warning" |

**Usage flushing (`flushUsageBuffer`):**
```typescript
// Clears the map and fires POST /enforcement/usage for each entry > 10s
for (const [packageName, seconds] of entries) {
    api.post('/enforcement/usage', {
        deviceId, packageName,
        appCategory: categorizeAndroid(packageName),
        durationSeconds: seconds,
        platform: 'ANDROID',
    }).catch(() => {})  // fire and forget
}
```

**Violation reporting (`reportViolation`):**
```typescript
api.post('/enforcement/events', {
    deviceId, processName: appName, ruleId, action,
    platform: 'ANDROID',
    timestamp: new Date().toISOString(),
}).catch(() => {})  // fire and forget
```

**`registerAppWatcher(deviceId)`** — exported function called at startup:
```typescript
await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 15,
    stopOnTerminate: false,  // keeps running when app is closed
    startOnBoot: true,       // auto-starts after phone reboot
})
```

---

### 5.3 `App.tsx` — Updated
**File:** `apps/mobile/App.tsx`

Added `AppWithSync` inner component that:

**Effect 1 — Start/stop RuleSync on login/logout:**
```typescript
useEffect(() => {
    if (user?.deviceId) {
        RuleSync.start(user.deviceId).catch(() => {})
        // registerAppWatcher called inside bootstrapMonitoring
    }
    return () => RuleSync.stop()
}, [user?.deviceId])
```

**Effect 2 — Handle silent push notifications for instant rule invalidation:**
```typescript
useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
        const data = notification.request.content.data
        if (data?.type === 'RULE_UPDATE' && user?.deviceId) {
            RuleSync.triggerSync().catch(() => {})
        }
    })
    return () => sub.remove()
}, [user?.deviceId])
```

When a parent saves a rule change, the backend sends a silent push notification with `{ type: 'RULE_UPDATE' }`. This listener triggers an immediate `fullSync()` — enforcing the new rule in under 1 second instead of waiting for the 30-second poll.

---

## 6. Part 4 — Cross-Platform Enforcement Matrix

| Rule Type | Desktop Agent (Windows) | Android App |
|---|---|---|
| **BLOCK_APP** | `taskkill /F /PID` — process killed within 2s ✅ | Full-screen red overlay shown ✅ |
| **BLOCK_URL** | Chrome window title check → kill ✅ | Cannot intercept browser — not enforced ❌ |
| **TIME_LIMIT** | Process killed when daily limit reached ✅ | Full-screen amber overlay ✅ |
| **TIME_LIMIT warning** | Windows notification (non-blocking) ✅ | Local push notification ✅ |
| **FOCUS_MODE** | All non-whitelisted apps killed ✅ | Full-screen blue overlay ✅ |
| **SCHEDULE** | Server time checked (anti-clock-manipulation) ✅ | Server time via TimeLimitStatus.date ✅ |
| **VIOLATION REPORT** | `POST /enforcement/events` with `platform: WINDOWS` ✅ | `POST /enforcement/events` with `platform: ANDROID` ✅ |
| **USAGE REPORT** | Every 5 min via UsageTracker ✅ | Every 5 min via usageBuffer ✅ |
| **RULES VERSION POLL** | Every 30s + SSE instant push ✅ | Every 30s + silent push notification ✅ |
| **OFFLINE RESILIENCE** | Last fetched rules stay in memory ✅ | Cached in AsyncStorage ✅ |

---

## 7. Part 5 — Rules Version Invalidation

### How Version Incrementing Works

Every time a parent modifies a rule (create / toggle / delete), `BlockingService` calls:

```java
// For device-specific rule:
enforcementStateRepository.incrementVersion(deviceId)

// For tenant-wide rule (device_id = NULL):
enforcementStateRepository.incrementVersionForTenant(tenantId)
```

The upsert SQL uses `ON CONFLICT DO UPDATE` so it's safe whether or not an `enforcement_state` row exists for the device yet.

### 30-Second Polling Path

```
Client polls GET /enforcement/version/{deviceId}
  ↓
{ version: 42 }   ← same as cached? → skip
{ version: 43 }   ← changed? → GET /enforcement/state/{deviceId}
                              → full state applied in engine
```

### Instant Push Path (Desktop — SSE)

```
Parent saves rule → BlockingService.createRule()
  ↓
enforcementStateRepository.incrementVersion()
  ↓
SSE endpoint broadcasts "rules_updated" event to connected agent
  ↓
RuleSync.connectSse() handler fires → fullSync() immediately
  ↓
New rule enforced within ~100ms
```

### Instant Push Path (Android — Silent Notification)

```
Parent saves rule → BlockingService.createRule()
  ↓
(Backend sends silent push notification with { type: "RULE_UPDATE" })
  ↓
App.tsx Notifications.addNotificationReceivedListener fires
  ↓
RuleSync.triggerSync() → fullSync()
  ↓
New rule enforced within ~1s
```

---

## 8. File-by-File Change Log

### Backend

| File | Status | Summary |
|---|---|---|
| `db/migration/V25__time_limit_enforcement.sql` | **NEW** | 3 new tables + platform column on enforcement_events |
| `enforcement/entity/DailyAppUsage.java` | **NEW** | JPA entity for daily_app_usage |
| `enforcement/entity/TimeLimitRule.java` | **NEW** | JPA entity for time_limit_rules |
| `enforcement/entity/EnforcementState.java` | **NEW** | JPA entity for enforcement_state |
| `enforcement/repository/DailyAppUsageRepository.java` | **NEW** | Custom queries for usage lookup |
| `enforcement/repository/TimeLimitRuleRepository.java` | **NEW** | Active rules for device/tenant |
| `enforcement/repository/EnforcementStateRepository.java` | **NEW** | getVersion + incrementVersion upsert |
| `enforcement/dto/TimeLimitEntryDto.java` | **NEW** | Per-rule status DTO |
| `enforcement/dto/TimeLimitStatusDto.java` | **NEW** | Device-level status wrapper DTO |
| `enforcement/dto/EnforcementStateDto.java` | **NEW** | Unified enforcement state DTO |
| `enforcement/dto/UsageReportDto.java` | **NEW** | Usage report payload DTO |
| `enforcement/service/TimeLimitService.java` | **NEW** | recordUsage, getStatus, checkTimeLimits |
| `enforcement/EnforcementStateController.java` | **NEW** | /state, /version, /usage endpoints |
| `enforcement/dto/EnforcementEventDto.java` | **UPDATED** | Added `platform` field |
| `enforcement/entity/EnforcementEvent.java` | **UPDATED** | Added `platform` column |
| `enforcement/service/EnforcementService.java` | **UPDATED** | Persists `platform` field |
| `blocking/service/BlockingService.java` | **UPDATED** | Calls incrementVersion on every rule change |
| `security/SecurityConfig.java` | **UPDATED** | New enforcement endpoints permit-all |

### Desktop Agent

| File | Status | Summary |
|---|---|---|
| `src/enforcement/RuleSync.ts` | **REPLACED** | Unified state sync, SSE, version poll, usage reporting |
| `src/enforcement/EnforcementEngine.ts` | **UPDATED** | Time limit + focus mode enforcement; exported types |
| `src/enforcement/UsageTracker.ts` | **NEW** | Per-process foreground time accumulator |

### Android App

| File | Status | Summary |
|---|---|---|
| `src/enforcement/RuleSync.ts` | **NEW** | Singleton state sync with AsyncStorage cache |
| `src/tasks/AppWatcherTask.ts` | **REPLACED** | Rule-aware watcher with color-coded overlays |
| `App.tsx` | **UPDATED** | Wires RuleSync lifecycle + silent push handler |

---

## 9. API Reference — New Endpoints

### `GET /api/v1/enforcement/state/{deviceId}`

Returns the complete enforcement state for a device. Both clients call this on startup and whenever the version changes.

**Authentication:** None required (permit-all). DeviceId validated against `devices` table.

**Response:**
```json
{
  "blockingRules": [
    {
      "id": "uuid",
      "ruleType": "APP",
      "target": "valorant.exe",
      "scheduleEnabled": true,
      "scheduleDays": "MON,TUE,WED,THU,FRI",
      "scheduleStart": "09:00",
      "scheduleEnd": "22:00",
      "active": true
    }
  ],
  "timeLimitStatus": {
    "deviceId": "uuid",
    "date": "2026-03-13",
    "entries": [
      {
        "ruleId": "uuid",
        "appCategory": "GAMING",
        "packageName": null,
        "dailyLimitSeconds": 3600,
        "usedSeconds": 2700,
        "remainingSeconds": 900,
        "limitReached": false,
        "warningThreshold": true
      }
    ]
  },
  "focusModeActive": true,
  "focusEndsAt": "2026-03-13T15:30:00Z",
  "focusWhitelist": ["VS Code", "Google Chrome"],
  "rulesVersion": 42
}
```

---

### `GET /api/v1/enforcement/version/{deviceId}`

Lightweight version check. Clients poll this every 30 seconds. Only triggers a full re-fetch if the version changes.

**Response:**
```json
{ "version": 42 }
```

---

### `POST /api/v1/enforcement/usage`

Both clients post incremental usage every ~5 minutes. Accumulated across platforms.

**Request body:**
```json
{
  "deviceId": "uuid",
  "appCategory": "GAMING",
  "packageName": "valorant.exe",
  "durationSeconds": 300,
  "platform": "WINDOWS"
}
```

**Response:** `200 OK` (empty body)

**Side effects:**
- Upserts `daily_app_usage` row
- Checks warning and limit thresholds
- Creates `Alert` rows if thresholds crossed

---

## 10. Database Schema — New Tables

### Entity-Relationship Summary

```
tenants
  └─── devices
         ├─── enforcement_state    (1:1 per device)
         ├─── daily_app_usage      (1:N per device per day)
         └─── time_limit_rules     (N per device or tenant-wide)

enforcement_state
  └─── focus_sessions (FK — optional)
```

### Index Strategy

| Table | Index | Purpose |
|---|---|---|
| `daily_app_usage` | `(device_id, usage_date DESC)` | Fast today's usage lookup |
| `daily_app_usage` | `(tenant_id, usage_date DESC)` | Tenant-level reporting |
| `time_limit_rules` | `(tenant_id, device_id, active)` | Active rules for device |
| `enforcement_state` | Primary key on `device_id` | Direct version lookup |

---

## 11. Design Decisions & Problem Solving

### Problem 1: Cross-Platform Usage Counting
**Challenge:** 30 min gaming on PC + 30 min on phone should count as 60 min total — not 30 min per platform.

**Solution:** Both platforms write to the **same `daily_app_usage` table** under the same `device_id`. A single row per `(device_id, date, category, package)` accumulates usage from all platforms. The `getTodayUsage()` query sums across all rows regardless of which platform reported them.

---

### Problem 2: Bandwidth-Efficient Rule Sync
**Challenge:** Fetching full rules state (which can be large) every 30 seconds from both desktop and mobile would be wasteful.

**Solution:** Two-tier sync:
1. Lightweight `GET /enforcement/version/{id}` returns a single integer (< 50 bytes). Poll this every 30s.
2. Full `GET /enforcement/state/{id}` (potentially several KB) only fetched when the version integer changes.

In steady state (no rule changes), each client sends one tiny HTTP request every 30 seconds.

---

### Problem 3: Instant Rule Enforcement
**Challenge:** Version polling means up to 30 seconds of lag when a parent sets "Block now."

**Solution:** Two parallel mechanisms for instant delivery:
- **Desktop:** SSE (`/api/v1/sse/device/{id}`) — persistent connection, server pushes `rules_updated` event within milliseconds
- **Android:** Silent push notification (`{ type: 'RULE_UPDATE' }`) — triggers `RuleSync.triggerSync()` immediately

Both paths fall back to the 30-second poll if the real-time channel is unavailable.

---

### Problem 4: Offline Resilience
**Challenge:** Students in areas with poor connectivity should still have rules enforced.

**Solution:**
- **Desktop:** Current rules stay in memory indefinitely. Sync failures log a warning but never clear `currentState`.
- **Android:** Rules persisted to `AsyncStorage` on every successful sync. On startup, cached state is loaded immediately before any network call — the watcher can enforce day-old rules with zero connectivity.

---

### Problem 5: Circular Import (TypeScript)
**Challenge:** `EnforcementEngine.ts` needed `TimeLimitStatus` and `TimeLimitEntry` types that were originally defined in `RuleSync.ts`. But `RuleSync.ts` imports `EnforcementEngine`. Circular dependency.

**Solution:** Moved the type definitions **into `EnforcementEngine.ts`** (the consumer) and exported them. `RuleSync.ts` then imports them from `EnforcementEngine.ts`. The dependency graph becomes a clean DAG:

```
EnforcementEngine.ts   ← defines types
       ↑
  RuleSync.ts          ← imports types from EnforcementEngine
  UsageTracker.ts      ← no dependencies on either
```

---

### Problem 6: `@Builder.Default` Warnings on New Entities
**Challenge:** Lombok `@Builder` does not use Java field initializers by default — fields like `private boolean active = true` would be `false` when the builder is used.

**Solution:** Added `@Builder.Default` annotation to every field with a non-null/non-false default in `DailyAppUsage`, `TimeLimitRule`, and `EnforcementState`. This ensures the builder correctly picks up the default values.

---

### Problem 7: `incrementVersion` Race Condition
**Challenge:** Multiple simultaneous rule saves could interleave version increments if using a read-modify-write pattern.

**Solution:** The increment is a **single native SQL upsert**:
```sql
INSERT INTO enforcement_state (device_id, rules_version) VALUES (:id, 1)
ON CONFLICT (device_id) DO UPDATE
SET rules_version = enforcement_state.rules_version + 1
```
PostgreSQL evaluates this as a single atomic operation with row-level locking — no race condition possible.

---

## 12. Completion Checklist

### Backend ✅
- [x] V25 migration applied — `daily_app_usage`, `time_limit_rules`, `enforcement_state` tables created
- [x] `platform` column added to `enforcement_events`
- [x] `GET /enforcement/state/{deviceId}` returns unified state
- [x] `GET /enforcement/version/{deviceId}` returns version number
- [x] `POST /enforcement/usage` records app usage from both clients
- [x] `POST /enforcement/events` accepts `platform` field (WINDOWS/ANDROID)
- [x] Rules version incremented on every rule create/toggle/delete
- [x] `TimeLimitService` checks warning threshold → creates LOW alert
- [x] `TimeLimitService` checks limit reached → creates MEDIUM alert
- [x] New endpoints are permit-all in `SecurityConfig`

### Desktop Agent ✅
- [x] `RuleSync` updated to use `/enforcement/state` (not `/blocking/rules` directly)
- [x] SSE connection for instant rule push (`/sse/device/{id}`)
- [x] Version poll fallback every 30 seconds
- [x] `EnforcementEngine.setTimeLimits()` — kills at limit
- [x] `EnforcementEngine.setFocusMode()` — kills non-whitelist during focus
- [x] `UsageTracker` accumulates per-process foreground time
- [x] Usage reported to `/enforcement/usage` every 5 min (`platform: WINDOWS`)
- [x] Time limit warning notification (non-blocking, deduplicated per threshold)
- [x] `TimeLimitEntry` / `TimeLimitStatus` / `BlockingRule` types exported from `EnforcementEngine.ts`
- [x] Circular import resolved

### Android App ✅
- [x] `RuleSync.ts` created — fetches `/enforcement/state` on startup
- [x] State cached in `AsyncStorage` — enforcement works offline
- [x] Version poll every 30 seconds
- [x] `triggerSync()` for instant re-fetch on silent push
- [x] `AppWatcherTask` uses `RuleSync` instead of direct API calls
- [x] Hard blocked app → red overlay + `APP_BLOCKED` violation report
- [x] Focus mode violation → blue overlay + `FOCUS_VIOLATION` violation report
- [x] Time limit reached → amber overlay + `TIME_LIMIT_REACHED` violation report
- [x] Time limit warning → quiet local notification (no overlay)
- [x] Usage flushed to `/enforcement/usage` every 5 min (`platform: ANDROID`)
- [x] `RuleSync.start()` called in `App.tsx` after login
- [x] `RuleSync.stop()` called on logout
- [x] Silent push handler (`RULE_UPDATE`) triggers immediate re-fetch

### Cross-Platform ✅
- [x] Parent sets ONE rule in web app
- [x] Both desktop and Android enforce it within 30 seconds (or instantly)
- [x] Parent sees violations from BOTH platforms in the alerts feed (platform field visible)
- [x] Time limit usage from BOTH platforms counted together in `daily_app_usage`
- [x] Focus mode started on web app → both devices enforce within 30s

---

*Document generated for KAVACH AI Mono Repo — Prompt 12 thread*
