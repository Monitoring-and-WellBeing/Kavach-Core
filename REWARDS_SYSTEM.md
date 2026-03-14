# 🎁 Kavach AI — Rewards System (Prompt 08)

> **XP → Rewards loop:** Students earn XP through focus & badges, redeem it for real-world rewards defined by parents, and parents approve/fulfill requests — all in real time.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Part 1 — Database Migration](#part-1--database-migration)
4. [Part 2 — Backend API](#part-2--backend-api)
5. [Part 3 — Parent Web App](#part-3--parent-web-app)
6. [Part 4 — Student Mobile App](#part-4--student-mobile-app)
7. [XP Accounting Design](#xp-accounting-design)
8. [API Reference](#api-reference)
9. [File Manifest](#file-manifest)
10. [Completion Checklist](#completion-checklist)

---

## Overview

The Rewards System closes the gamification loop already present in Kavach AI (XP, badges, levels). Parents define a catalog of real-world rewards — extra screen time, pizza nights, outings, purchases — each with an XP cost. Students browse available rewards in the mobile app, tap **Redeem**, optionally add a note, and send a request to their parent. The parent sees the request in the web dashboard, can approve or deny it (with a note), and later marks it as fulfilled once the reward is given. Both sides see live status updates.

**Key capabilities:**
- Parent-defined reward catalog (predefined categories + fully custom)
- Student redemption requests with optional personal note
- Parent approve / deny / fulfill workflow
- XP automatically held on redemption, released (refunded) on denial
- Alerts created in the notification system on request & resolution
- Full redemption history for both parent and student

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL DB                     │
│  rewards table          reward_redemptions table    │
│  (parent-defined)       (student requests)          │
└────────────────────────┬────────────────────────────┘
                         │ Flyway V20
                         ▼
┌─────────────────────────────────────────────────────┐
│             Spring Boot Backend                     │
│  com.kavach.rewards                                 │
│  ├── RewardController   (8 REST endpoints)          │
│  ├── RewardService      (business logic + XP)       │
│  ├── RewardRepository                               │
│  └── RedemptionRepository                          │
└───────────┬─────────────────────┬───────────────────┘
            │                     │
            ▼                     ▼
┌───────────────────┐   ┌─────────────────────────────┐
│  Parent Web App   │   │     Student Mobile App       │
│  Next.js 14       │   │     React Native / Expo      │
│  /parent/rewards  │   │     RewardsScreen (Tab 4)    │
└───────────────────┘   └─────────────────────────────┘
```

---

## Part 1 — Database Migration

**File:** `backend/src/main/resources/db/migration/V20__rewards.sql`

### New PostgreSQL ENUMs

```sql
reward_category:   SCREEN_TIME | OUTING | FOOD_TREAT | PURCHASE | PRIVILEGE | CUSTOM
redemption_status: PENDING | APPROVED | DENIED | FULFILLED
```

### `rewards` Table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `tenant_id` | UUID FK → tenants | Multi-tenant isolated |
| `title` | VARCHAR(200) | e.g. "Pizza night" |
| `description` | TEXT | Optional description |
| `category` | reward_category | Enum |
| `xp_cost` | INTEGER | Must be > 0 |
| `icon` | VARCHAR(10) | Emoji, default 🎁 |
| `active` | BOOLEAN | Toggle on/off |
| `created_by` | UUID FK → users | Parent who created it |
| `created_at` | TIMESTAMPTZ | Auto |

### `reward_redemptions` Table

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `reward_id` | UUID FK → rewards | Which reward |
| `device_id` | UUID FK → devices | Student's device |
| `tenant_id` | UUID FK → tenants | Tenant isolation |
| `student_user_id` | UUID FK → users | Student user |
| `xp_spent` | INTEGER | Snapshot of cost at time of request |
| `status` | redemption_status | Lifecycle state |
| `student_note` | TEXT | Optional message from student |
| `parent_note` | TEXT | Optional response from parent |
| `requested_at` | TIMESTAMPTZ | When student requested |
| `resolved_at` | TIMESTAMPTZ | When parent approved/denied |
| `fulfilled_at` | TIMESTAMPTZ | When parent marked as given |

### Performance Indexes

```sql
idx_rewards_tenant        — (tenant_id)
idx_rewards_active        — (tenant_id, active)
idx_redemptions_tenant    — (tenant_id, status)
idx_redemptions_student   — (student_user_id)
idx_redemptions_device    — (device_id)
```

### Demo Seed Data

6 predefined rewards seeded for `parent@demo.com`'s demo tenant:

| Icon | Title | Category | XP Cost |
|---|---|---|---|
| 📱 | 30 min extra screen time | SCREEN_TIME | 200 |
| 🍕 | Pizza night | FOOD_TREAT | 350 |
| 🌳 | Park outing | OUTING | 400 |
| 🌙 | Stay up 30 min late | PRIVILEGE | 300 |
| 📚 | Book of your choice | PURCHASE | 500 |
| 🎮 | Game of your choice | PURCHASE | 800 |

---

## Part 2 — Backend API

**Package:** `com.kavach.rewards`

### Entities

#### `Reward.java`
JPA entity mapping the `rewards` table. Uses `@Enumerated(EnumType.STRING)` for `RewardCategory`, Lombok `@Builder` / `@Getter` / `@Setter`, Hibernate UUID generator.

#### `RewardRedemption.java`
JPA entity mapping `reward_redemptions`. Stores full lifecycle — `requestedAt`, `resolvedAt`, `fulfilledAt` as `OffsetDateTime`. Status tracked via `RedemptionStatus` enum.

#### `RewardCategory.java` / `RedemptionStatus.java`
Java enums matching the PostgreSQL enum types.

### DTOs

| DTO | Direction | Fields |
|---|---|---|
| `RewardDto` | Response | id, title, description, category, xpCost, icon, active, createdAt |
| `RedemptionDto` | Response | id, reward (nested), studentName, xpSpent, status, notes, timestamps + relative time |
| `CreateRewardDto` | Request | title, description, category, xpCost, icon |
| `RedeemRequestDto` | Request | note (optional), deviceId |
| `ResolveRedemptionDto` | Request | status ("APPROVED"/"DENIED"), parentNote |

### Repositories

#### `RewardRepository`
```java
findByTenantIdOrderByCreatedAtDesc(tenantId)              // Parent catalog
findByTenantIdAndActiveTrueOrderByXpCostAsc(tenantId)    // Student view
findByIdAndTenantId(id, tenantId)                        // Tenant-safe lookup
```

#### `RedemptionRepository`
```java
findByTenantIdAndStatusOrderByRequestedAtDesc(tenantId, status)   // Pending queue
findByStudentUserIdOrderByRequestedAtDesc(studentId)               // Student history
findByIdAndTenantId(id, tenantId)                                  // Tenant-safe lookup
totalXpSpentByDevice(deviceId)                                     // Native SQL XP sum
```

The `totalXpSpentByDevice` query sums `xp_spent` only for `PENDING`, `APPROVED`, and `FULFILLED` redemptions — `DENIED` entries are excluded, effectively auto-refunding XP.

### `RewardService.java` — Business Logic

| Method | Description |
|---|---|
| `getRewardsForTenant` | All rewards for parent |
| `getActiveRewardsForTenant` | Active rewards sorted by XP cost ascending |
| `create` | Creates new reward, defaults unknown categories to CUSTOM |
| `toggle` | Flips `active` flag |
| `redeem` | Validates XP, creates redemption, fires parent alert |
| `getPendingRedemptions` | Returns PENDING queue for parent |
| `resolve` | APPROVED or DENIED — sets `resolvedAt`, fires student alert |
| `fulfill` | APPROVED → FULFILLED — sets `fulfilledAt` |
| `getRedemptionsForStudent` | Full history for student |
| `getAvailableXp` | `earned - spent` (non-denied) |

**XP validation in `redeem()`:**
```java
long earned    = studentBadgeRepo.totalXpByDevice(deviceId);
long spent     = redemptionRepo.totalXpSpentByDevice(deviceId);
long available = earned - spent;

if (available < reward.getXpCost()) {
    throw new IllegalArgumentException(
        "Not enough XP. Need " + reward.getXpCost() + " XP, have " + available);
}
```

**Alert integration:** Uses the existing `AlertRepository` directly to create `INFO`-severity alerts on redemption request and on resolution.

### `RewardController.java` — REST Endpoints

All endpoints under `/api/v1/rewards`. Authentication via `@AuthenticationPrincipal String email` (existing JWT pattern). Tenant isolation enforced in every service call.

---

## Part 3 — Parent Web App

### `src/lib/rewards.ts`

Typed API client and shared constants:

- **Types:** `RewardCategory`, `RedemptionStatus`, `Reward`, `Redemption`
- **`REWARD_SUGGESTIONS`** — 6 predefined reward templates for the create modal
- **`CATEGORY_LABELS`** — Display names for each category
- **`STATUS_CONFIG`** — Color + label config for each redemption status
- **`rewardsApi`** — Axios-backed API methods: `getAll`, `create`, `toggle`, `getPending`, `resolve`, `fulfill`, `getAvailable`, `redeem`, `getMine`

### `/parent/rewards/page.tsx`

Two-column responsive layout:

#### Left Column — Reward Catalog

- Lists all tenant rewards (active and inactive)
- **RewardCard** component shows: emoji icon, title, description, category badge, XP cost
- **Toggle button** (ToggleRight/ToggleLeft icons) to enable/disable individual rewards
- Disabled rewards shown with dashed border + reduced opacity
- Empty state with "Create First Reward" CTA

#### Right Column — Pending Requests

- **RedemptionCard** component shows:
  - Student name + reward title with emoji
  - Time since requested (relative, e.g. "10 minutes ago")
  - Student's note in a blue highlight box
  - XP to be deducted
  - Status badge (color-coded)
- **Deny flow:** clicking Deny opens an inline note input before confirming — no accidental denials
- **Approve button:** gradient blue-purple, immediately processes
- **Mark as Fulfilled:** purple button appears on approved cards (also in "Recently Resolved" section)
- Empty state: "All caught up!" when no pending requests

#### Recently Resolved Section

Shows last 5 resolved redemptions below the pending queue, with inline "Mark Fulfilled" buttons for any still in APPROVED state.

#### Create Reward Modal

Full-featured modal with:
- Title input (required)
- Category dropdown (6 options)
- Description input
- Icon (emoji) + XP Cost inputs side by side
- **Quick suggestion chips** — click any of 6 predefined rewards to auto-fill the entire form
- Disabled submit until title + valid XP cost provided
- Cancel / Create buttons

### Updated `layout.tsx`

Added `🎁 Rewards` to the parent sidebar navigation between "Alerts & Rules" and "Subscription", using the `Gift` icon from `lucide-react`.

---

## Part 4 — Student Mobile App

### `src/lib/rewardsApi.ts`

Typed API client for the mobile app:

- **Types:** `RedemptionStatus`, `Reward`, `Redemption`
- **`STATUS_CONFIG`** — Color map for status badges: amber (PENDING), green (APPROVED), red (DENIED), indigo (FULFILLED)
- **`rewardsApi`** — `getAvailable()`, `getMine()`, `redeem(rewardId, deviceId, note?)`

### `src/screens/RewardsScreen.tsx`

Full-featured 4th tab screen:

#### XP Header Card

Blue gradient card showing:
- Available XP (earned from badges minus pending/approved/fulfilled spend)
- Current level
- Progress bar toward next level
- Hint text: "Spend your XP on rewards below"

#### Available Rewards List

- `FlatList` of `RewardCard` components
- Each card: large emoji, title, description, XP cost (right-aligned)
- **Grayed out + non-tappable** when student doesn't have enough XP
- Empty state if parent hasn't added any rewards yet

#### My Requests Section

- Shows all past redemptions grouped in a white card
- Each row: emoji, reward title, relative timestamp, parent note (if any)
- **Color-coded status badge** for each redemption

#### Redeem Bottom Sheet Modal

Slides up from bottom when a reward card is tapped:
- Drag handle at top
- Reward title with emoji
- Three XP chips: "Costs X XP" · "You have Y XP" · "After: Z XP"
- After-XP chip turns red if insufficient (shouldn't be reachable but defensive)
- Multi-line text input for optional note to parent
- **"Send Request to Parent 🚀"** button (shows spinner while loading)
- Cancel link

#### Post-Redeem Alert

Native `Alert.alert` confirmation:
> "🎉 Request Sent! Your request for 'Pizza night' has been sent to your parent. They'll review it soon!"

#### Pull-to-Refresh

`RefreshControl` for manual data refresh.

### Updated `AppNavigator.tsx`

Added `Rewards` as the 4th tab in the bottom navigation:

```typescript
RootTabParamList = {
  Home: undefined,
  StudyBuddy: undefined,    // added by user
  Focus: undefined,
  Achievements: undefined,
  Rewards: undefined,        // ← new
}

TAB_ICONS = {
  ...
  Rewards: { active: 'gift', inactive: 'gift-outline' },
}
```

```tsx
<Tab.Screen name="Rewards" component={RewardsScreen} />
```

---

## XP Accounting Design

Instead of a separate XP transactions table, the system uses a **redemption-as-deduction** model:

```
Available XP = (sum of badge XP earned) − (sum of xp_spent on PENDING + APPROVED + FULFILLED redemptions)
```

**Why this works:**
- `PENDING` — XP is held (reserved) while request awaits parent action
- `APPROVED` — XP remains held (parent approved, reward pending delivery)
- `FULFILLED` — XP permanently consumed
- `DENIED` — excluded from the sum → XP is automatically "refunded" with no extra write

This means no separate refund operation is needed. Denial is idempotent and self-correcting.

```java
// RedemptionRepository.java
@Query(value = """
    SELECT COALESCE(SUM(xp_spent), 0)
    FROM reward_redemptions
    WHERE device_id = :deviceId
      AND status IN ('PENDING', 'APPROVED', 'FULFILLED')
    """, nativeQuery = true)
long totalXpSpentByDevice(@Param("deviceId") UUID deviceId);
```

---

## API Reference

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/rewards` | Parent | List all rewards for tenant |
| `POST` | `/api/v1/rewards` | Parent | Create a new reward |
| `PATCH` | `/api/v1/rewards/{id}/toggle` | Parent | Enable / disable reward |
| `GET` | `/api/v1/rewards/available` | Student | Active rewards (sorted by XP cost) |
| `POST` | `/api/v1/rewards/{id}/redeem` | Student | Submit redemption request |
| `GET` | `/api/v1/rewards/redemptions/pending` | Parent | Pending requests needing action |
| `POST` | `/api/v1/rewards/redemptions/{id}/resolve` | Parent | Approve or deny a request |
| `POST` | `/api/v1/rewards/redemptions/{id}/fulfill` | Parent | Mark reward as physically given |
| `GET` | `/api/v1/rewards/redemptions/mine` | Student | Student's own redemption history |

### Example: Redeem Request

```http
POST /api/v1/rewards/{rewardId}/redeem
Authorization: Bearer <student-jwt>
Content-Type: application/json

{
  "deviceId": "a1b2c3d4-...",
  "note": "I finished all my homework this week!"
}
```

```json
{
  "id": "...",
  "reward": { "id": "...", "title": "Pizza night", "icon": "🍕", "xpCost": 350 },
  "status": "PENDING",
  "xpSpent": 350,
  "studentNote": "I finished all my homework this week!",
  "requestedAt": "2026-03-13T14:22:00Z",
  "requestedAtRelative": "Just now"
}
```

### Example: Resolve (Approve)

```http
POST /api/v1/rewards/redemptions/{id}/resolve
Authorization: Bearer <parent-jwt>

{
  "status": "APPROVED",
  "parentNote": "Great work this week! 🎉"
}
```

---

## File Manifest

### New Files Created

```
backend/
└── src/main/resources/db/migration/
    └── V20__rewards.sql                          ← DB schema + seed

backend/src/main/java/com/kavach/rewards/
├── RewardController.java                         ← 8 REST endpoints
├── dto/
│   ├── CreateRewardDto.java
│   ├── RedeemRequestDto.java
│   ├── RedemptionDto.java
│   ├── ResolveRedemptionDto.java
│   └── RewardDto.java
├── entity/
│   ├── Reward.java
│   ├── RewardCategory.java
│   ├── RedemptionStatus.java
│   └── RewardRedemption.java
├── repository/
│   ├── RedemptionRepository.java
│   └── RewardRepository.java
└── service/
    └── RewardService.java

apps/web-app/src/
├── lib/rewards.ts                                ← Typed API client + constants
└── app/parent/rewards/
    └── page.tsx                                  ← Full rewards management page

apps/mobile/src/
├── lib/rewardsApi.ts                             ← Mobile typed API client
└── screens/RewardsScreen.tsx                    ← 4th tab rewards screen
```

### Modified Files

```
apps/web-app/src/app/parent/layout.tsx            ← Added 🎁 Rewards to sidebar
apps/mobile/src/navigation/AppNavigator.tsx       ← Added Rewards as 4th tab
```

---

## Completion Checklist

### Backend
- [x] `V20__rewards.sql` migration applied (rewards + redemptions tables)
- [x] 6 demo rewards seeded for demo tenant
- [x] `RewardController` — all 9 endpoints return correct data
- [x] XP deducted on redemption (held via accounting), auto-refunded on denial
- [x] Alert created when student requests a redemption
- [x] Alert created when parent approves or denies

### Parent Web App
- [x] `/parent/rewards` page exists and linked in sidebar
- [x] Reward catalog shows with create / toggle actions
- [x] Pending requests show with approve / deny / fulfill actions
- [x] Inline deny note input (no accidental denials)
- [x] Predefined reward suggestions in create modal (click to prefill)
- [x] Recently resolved section with "Mark Fulfilled" shortcut
- [x] Category badges, XP costs, relative timestamps

### Student Mobile App
- [x] `RewardsScreen` added as 4th bottom-tab (gift icon)
- [x] Available rewards shown with XP cost
- [x] Disabled / grayed state when student lacks sufficient XP
- [x] Redeem flow: tap → bottom sheet → note → confirm → pending status
- [x] "My Requests" section shows history with color-coded status badges
- [x] Native alert confirmation on successful request
- [x] Pull-to-refresh

---

## Dependencies

No new npm packages or Maven dependencies were required. The implementation reuses:

- **Backend:** Spring Data JPA, Lombok, existing `AlertRepository`, `StudentBadgeRepository`, `UserRepository`
- **Web App:** Existing `axios` instance, `Modal`, `Toast` components, `lucide-react` icons
- **Mobile:** Existing `axios` instance, `react-native-safe-area-context`, `@expo/vector-icons/Ionicons`
