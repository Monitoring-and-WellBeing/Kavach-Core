# KAVACH AI — Prompt 09: AI Study Buddy + Gemini Integrations

> **Completed:** March 2026  
> **Touches:** `backend/` · `apps/mobile/` · `apps/web-app/`  
> **AI Model:** Google Gemini 1.5 Flash

---

## Overview

This prompt added a full suite of AI-powered features to the KAVACH parental-control + student productivity platform, integrating Google's Gemini 1.5 Flash model across three surfaces:

| Surface | Feature |
|---------|---------|
| 📱 Student Mobile App | AI Study Buddy chat, Daily mood check-in, Personalized motivational message |
| 🌐 Parent Web App | Richer AI weekly digest, 7-day mood trend chart, AI-generated rule suggestions |
| 🖥️ Backend (Spring Boot) | Scoped Gemini service, rate-limiting, topic extraction, mood storage, motivation caching |

---

## Part 1 — Backend

### Database Migration — `V19__ai_study_buddy.sql`

Three new tables added via Flyway migration:

#### `student_ai_usage`
Stores one record per AI interaction — **topic tag only**, never raw questions.

```sql
CREATE TABLE IF NOT EXISTS student_ai_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  topic         VARCHAR(100),          -- e.g. "Math/Fractions"
  question_hash VARCHAR(64),           -- SHA-256 hash for dedup, not raw text
  used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_student_date ON student_ai_usage(student_id, used_at DESC);
```

#### `mood_checkins`
Daily student emotional check-in data (1–5 scale).

```sql
CREATE TABLE IF NOT EXISTS mood_checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES users(id),
  device_id     UUID REFERENCES devices(id),   -- nullable
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  mood          INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  mood_label    VARCHAR(20),                   -- 'great','good','okay','tired','stressed'
  note          TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mood_student ON mood_checkins(student_id, checked_in_at DESC);
CREATE INDEX idx_mood_device  ON mood_checkins(device_id,  checked_in_at DESC);
```

#### `daily_motivation`
Per-device/per-day Gemini message cache — unique constraint prevents redundant API calls.

```sql
CREATE TABLE IF NOT EXISTS daily_motivation (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  UUID NOT NULL REFERENCES devices(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  message    TEXT NOT NULL,
  cache_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (device_id, cache_date)
);
```

---

### New Package: `com.kavach.ai`

All AI-related code lives in a dedicated package to keep concerns separated.

```
com.kavach.ai/
├── entity/
│   ├── StudentAiUsage.java
│   ├── MoodCheckin.java          (@Entity(name = "AiMoodCheckin"))
│   └── DailyMotivation.java
├── repository/
│   ├── StudentAiUsageRepository.java
│   ├── AiMoodCheckinRepository.java
│   └── DailyMotivationRepository.java
├── dto/
│   ├── StudyBuddyChatRequest.java
│   ├── StudyBuddyResponse.java
│   ├── MoodCheckinRequest.java
│   ├── MoodCheckinResponse.java
│   ├── MoodTrendItem.java
│   ├── TopicSummaryResponse.java
│   └── RuleSuggestion.java
├── service/
│   ├── StudentGeminiService.java
│   ├── MotivationService.java
│   ├── MoodService.java          (@Service("aiMoodService"))
│   └── RuleSuggestionService.java
├── StudyBuddyController.java
├── MoodController.java           (@RestController("aiMoodController"))
└── MotivationController.java
```

---

### `StudentGeminiService.java`

The core scoped AI chat engine.

**Guardrails (non-negotiable):**
- STEM-only system prompt — refuses any non-Math/Science question with a friendly redirect
- Hard daily limit of **10 interactions per student** enforced at DB level
- **No raw question storage** — only SHA-256 hash stored for deduplication
- Topic tag extracted from every response via regex: `[TOPIC: Math/Fractions]`
- Responses capped at 400 tokens / ~200 words

**System prompt scope:**
- Indian curriculum (CBSE, ICSE, State boards), Classes 5–12
- Guides students to answers — never just gives them
- Detects student distress and redirects to trusted adults
- Appends `[TOPIC: subject/topic]` on last line (parsed by backend, not shown to student)

**Endpoints:**
```
POST /api/v1/ai/study-buddy/chat     — student sends question
GET  /api/v1/ai/study-buddy/usage    — remaining questions today
GET  /api/v1/ai/study-buddy/topics   — parent sees topic summary for their child
```

---

### `MotivationService.java`

Generates personalized daily motivational messages using student context.

**Input data used in prompt:**
- Current streak (days)
- Focus score today (0–100)
- Last mood check-in value + label
- Time of day (morning / afternoon / evening)

**Caching strategy:** Result cached in `daily_motivation` table per device per day — Gemini is called **at most once per device per calendar day**. Subsequent requests return the cached row.

**Sample outputs:**
- *"5-day streak! You're building real habits 🔥 Keep the momentum going today."*
- *"Rough day? That's okay. Even 20 minutes of focus counts. You've got this."*

**Endpoint:**
```
GET /api/v1/ai/motivation/{deviceId}
```

---

### `MoodService.java`

Manages student emotional check-ins.

**Features:**
- Submit mood (1–5) with optional note → awards **+10 XP** via gamification service
- Prevents duplicate same-day check-ins
- `getWeeklyMoodSummary(studentId)` — plain-text summary for AI digest prompt
- `getWeeklyMoodSummaryByDevice(deviceId)` — device-scoped variant used by `InsightService`
- `getMoodHistory(deviceId, days)` — returns `List<MoodTrendItem>` for parent chart

**Endpoints:**
```
POST /api/v1/mood/checkin            — student submits mood (body includes deviceId)
GET  /api/v1/mood/history/{deviceId} — parent sees 7-day mood trend
```

---

### `RuleSuggestionService.java`

Analyzes tenant-level usage patterns and asks Gemini to suggest 1–3 parental control rules.

**Logic:**
- Fetches top app usage data for the student's device
- Sends structured prompt to Gemini asking for concrete, actionable rule suggestions
- Returns `List<RuleSuggestion>` with fields: `title`, `description`, `suggestedApp`, `suggestedTimeLimit`
- Parent can one-click apply each suggestion → creates a real block rule

**Endpoint:**
```
GET /api/v1/ai/rule-suggestions
```

---

### Updated: `InsightService.java` + `GeminiService.java`

**`InsightService`** now calls `moodService.getWeeklyMoodSummaryByDevice(deviceId)` and passes the mood summary into the Gemini prompt alongside existing app usage and focus session data.

**`GeminiService.analyzeStudentActivity`** updated with a richer 4-section prompt structure:

```
Analyze this student's digital week and write a parent report.

USAGE DATA: {appUsageSummary}
MOOD DATA:  {moodSummary}
FOCUS DATA: {focusSessions}

Write a parent report with these sections:
1. SUMMARY         (2 sentences — overall week assessment)
2. WHAT WENT WELL  (1-2 specific positives)
3. WATCH OUT FOR   (1 concern if any, gentle tone)
4. SUGGESTION      (1 actionable recommendation for the parent)

Tone: warm, factual, supportive. Not alarmist. Under 150 words.
```

---

## Part 2 — Student Mobile App

### `StudyBuddyScreen.tsx` (new screen)

Full chat UI for the AI Study Buddy.

**UI features:**
- Blue header showing `🔬 Study Buddy` title + live **"N questions left today"** counter
- STEM scope reminder subtitle
- Chat bubbles: user messages right (blue), AI responses left (white card with shadow)
- 📚 Topic tag shown under each AI response (e.g. `Math/Geometry`)
- `ActivityIndicator` typing indicator while Gemini responds
- **Limit reached state** — input locked, friendly "Come back tomorrow! 🌟" placeholder, no crash
- `KeyboardAvoidingView` for iOS/Android compatibility
- Auto-scrolls to latest message on new content

**API call:**
```typescript
POST /api/v1/ai/study-buddy/chat  →  { message: string }
// Response: { message, topic, remainingQuestions, limitReached }
```

---

### `MoodCheckIn.tsx` (updated component)

Daily mood check-in card shown on Dashboard.

**Behaviour:**
- On mount, calls `moodApi.getToday(deviceId)` — if already checked in today, shows the submitted mood in a "done" state (no re-submit)
- 5 emoji buttons: 😢 Awful · 😟 Bad · 😐 Okay · 🙂 Good · 😄 Great!
- On selection → `ActivityIndicator` replaces emoji while submitting
- Success state: large emoji + mood label + **"+10 XP earned ✅"** (only shown for fresh check-ins, not pre-existing ones)
- `onCheckedIn(mood)` callback bubbles up to Dashboard for celebration overlay
- Component exported as **named export** `MoodCheckin` (aligns with existing `DashboardScreen` import)

---

### `DashboardScreen.tsx` (updated)

Two new sections added above the weekly chart:

#### Motivational Message Card
```typescript
useEffect(() => {
  api.get(`/ai/motivation/${user?.deviceId}`)
    .then(res => setMotivation(res.data.message))
    .catch(() => {})
}, [])
```
- Blue gradient card (`#2563EB`) shown below greeting
- Displays Gemini-generated personalized message
- Only renders when `motivation` state is non-null (hides on API failure — no crash)

#### Mood Check-in Card
- `<MoodCheckin deviceId={data.deviceId} onCheckedIn={handleMoodCheckin} />`
- On mood ≥ 4 (good/great) → triggers `Celebration` overlay: *"Mood checked in! +10 XP 😊"*
- No more `AsyncStorage` date-key hack — server-side dedup via `getToday` endpoint

#### Also added (pre-existing components now wired in):
- `<StreakCard deviceId={data.deviceId} />` — streak display
- `<DailyChallenges>` with `onChallengeCompleted` → celebration overlay
- `<Celebration>` overlay component for XP/achievement toasts

---

### `AppNavigator.tsx` (updated)

Added **Study Buddy** as a dedicated tab:

```typescript
// Tab order: Home → StudyBuddy → Focus → Rewards → Profile
<Tab.Screen
  name="StudyBuddy"
  component={StudyBuddyScreen}
  options={{ tabBarLabel: 'Study Buddy', tabBarIcon: ... }}
/>
```

Icon: `school` (Ionicons) with same active/inactive color scheme as other tabs.

---

## Part 3 — Parent Web App

### `src/lib/insights.ts` (updated)

New TypeScript types and API helpers added:

```typescript
// New types
export interface MoodTrendItem    { date: string; mood: number; label: string }
export interface TopicSummary     { topic: string; count: number }
export interface RuleSuggestion   { title: string; description: string; suggestedApp?: string; suggestedTimeLimit?: number }

// New API calls
export const moodApi = {
  getHistory: (deviceId: string, days = 7) =>
    axios.get<MoodTrendItem[]>(`/api/v1/mood/history/${deviceId}?days=${days}`)
}
export const studyBuddyApi = {
  getTopics: (deviceId: string) =>
    axios.get<TopicSummary[]>(`/api/v1/ai/study-buddy/topics?deviceId=${deviceId}`)
}
export const ruleSuggestionsApi = {
  getSuggestions: () =>
    axios.get<RuleSuggestion[]>(`/api/v1/ai/rule-suggestions`)
}
```

---

### `MoodTrendChart.tsx` (new component)

7-day mood bubble visualization using SVG (no heavy charting lib dependency).

**Visual design:**
- One emoji bubble per day of the week
- Color-coded by mood level:
  - 😄 Great → `#22C55E` (green)
  - 🙂 Good → `#84CC16` (lime)
  - 😐 Okay → `#F59E0B` (amber)
  - 😔 Tired → `#F97316` (orange)
  - 😟 Stressed → `#EF4444` (red)
- Dashed SVG line connecting days where check-ins exist
- **Average mood badge** shown in card header
- Student name displayed: *"Mood data from Arjun's daily check-ins"*
- Graceful empty state when no check-in data available

**Location:** `apps/web-app/src/components/charts/MoodTrendChart.tsx`

---

### `AiRuleSuggestions.tsx` (new component)

Collapsible AI suggestions panel for the parent control page.

**Behaviour:**
- Initially collapsed — **lazy loads** suggestions only when parent opens the panel
- Each suggestion card shows: title, description, optional app name + time limit
- **"Apply" button** → calls `blockingApi.createRule()` to create a real block rule
- Shows ✅ Applied state per card — prevents double-applying
- Handles loading + error states gracefully

**Location:** `apps/web-app/src/components/rules/AiRuleSuggestions.tsx`

---

### `parent/control/page.tsx` (updated)

`<AiRuleSuggestions />` panel injected above the existing tabs section:

```tsx
{/* AI Rule Suggestions */}
<AiRuleSuggestions />

{/* Existing tabs: Block List / Schedule / etc */}
<Tabs ...>
```

---

### `parent/insights/page.tsx` (updated)

New 2-column row added above the main insight cards grid:

| Left column | Right column |
|-------------|--------------|
| **7-Day Mood Trend** — `<MoodTrendChart>` | **Study Buddy Topics** — distinct topic tags from the week |

**Study Buddy Topics panel:**
- Shows topic tags only (e.g. `Math/Fractions`, `Science/Photosynthesis`)
- Full questions are **never shown to parents** — topic granularity only
- Displays count per topic
- Empty state: *"No Study Buddy activity this week"*

**Data fetching:** `moodApi.getHistory()` and `studyBuddyApi.getTopics()` called in parallel alongside existing insights fetch.

---

## Privacy & Security Design

| Concern | Implementation |
|---------|---------------|
| Raw student questions | **Never stored** — SHA-256 hash only, for deduplication |
| Parent visibility | Topics only (`Math/Fractions`) — not question text |
| Daily AI limit | Hard-enforced at DB level via `COUNT` query — not just in-memory |
| Off-topic requests | Refused by Gemini system prompt before reaching application logic |
| Distress detection | System prompt redirects student to trusted adults |
| Motivation caching | `UNIQUE(device_id, cache_date)` constraint — at most 1 Gemini call/device/day |
| Missing API key | All services fall back to mock responses — no crashes, no exposed errors |

---

## Completion Checklist

### Backend
- [x] V19 migration — `student_ai_usage`, `mood_checkins`, `daily_motivation` tables
- [x] `StudentGeminiService` — STEM-only system prompt enforced
- [x] Daily limit of 10 questions enforced at DB level
- [x] Topic extracted and stored (raw messages never persisted)
- [x] Mood check-in endpoint — returns `+10 XP`
- [x] Daily motivation endpoint — cached per device per day
- [x] Parent topic summary endpoint — topics only, not full questions
- [x] AI rule suggestions endpoint — analyzes usage, returns actionable suggestions
- [x] Weekly digest upgraded — includes mood trend in Gemini prompt
- [x] 4-section structured parent report (SUMMARY / WHAT WENT WELL / WATCH OUT FOR / SUGGESTION)

### Student Mobile App
- [x] `StudyBuddyScreen` — full chat UI with bubble design
- [x] STEM scope enforced via Gemini system prompt
- [x] Remaining questions counter in header
- [x] Limit reached state — graceful message, input locked, no crash
- [x] Mood check-in card — server-side dedup (no AsyncStorage hack)
- [x] `+10 XP` shown on fresh check-ins; "Today's mood" shown on pre-existing
- [x] Daily motivational message on Dashboard (cached, hides on API failure)
- [x] `StudyBuddy` tab added to `AppNavigator`
- [x] `Celebration` overlay wired to mood + challenge completions

### Parent Web App
- [x] AI weekly digest includes mood trend data
- [x] 7-day mood trend chart on parent insights page
- [x] AI rule suggestions panel on `/parent/control` (lazy-loaded, collapsible)
- [x] Study Buddy topics panel on `/parent/insights` (topic tags only — not full questions)
- [x] `MoodTrendChart`, `AiRuleSuggestions` components created
- [x] New API helpers in `lib/insights.ts`

---

## File Manifest

### New Files Created

| Path | Description |
|------|-------------|
| `backend/.../db/migration/V19__ai_study_buddy.sql` | DB tables: ai_usage, mood_checkins, daily_motivation |
| `backend/.../ai/entity/StudentAiUsage.java` | JPA entity |
| `backend/.../ai/entity/MoodCheckin.java` | JPA entity |
| `backend/.../ai/entity/DailyMotivation.java` | JPA entity |
| `backend/.../ai/repository/StudentAiUsageRepository.java` | Spring Data repo |
| `backend/.../ai/repository/AiMoodCheckinRepository.java` | Spring Data repo |
| `backend/.../ai/repository/DailyMotivationRepository.java` | Spring Data repo |
| `backend/.../ai/dto/StudyBuddyChatRequest.java` | DTO |
| `backend/.../ai/dto/StudyBuddyResponse.java` | DTO |
| `backend/.../ai/dto/MoodCheckinRequest.java` | DTO |
| `backend/.../ai/dto/MoodCheckinResponse.java` | DTO |
| `backend/.../ai/dto/MoodTrendItem.java` | DTO |
| `backend/.../ai/dto/TopicSummaryResponse.java` | DTO |
| `backend/.../ai/dto/RuleSuggestion.java` | DTO |
| `backend/.../ai/service/StudentGeminiService.java` | Core scoped AI chat service |
| `backend/.../ai/service/MotivationService.java` | Daily motivation generation + caching |
| `backend/.../ai/service/MoodService.java` | Mood check-in management |
| `backend/.../ai/service/RuleSuggestionService.java` | AI rule suggestion generation |
| `backend/.../ai/StudyBuddyController.java` | REST controller |
| `backend/.../ai/MoodController.java` | REST controller |
| `backend/.../ai/MotivationController.java` | REST controller |
| `apps/mobile/src/screens/StudyBuddyScreen.tsx` | Chat UI screen |
| `apps/web-app/src/components/charts/MoodTrendChart.tsx` | 7-day mood chart |
| `apps/web-app/src/components/rules/AiRuleSuggestions.tsx` | AI rule suggestions panel |

### Modified Files

| Path | Change |
|------|--------|
| `backend/.../insights/service/InsightService.java` | Added mood data to weekly digest |
| `backend/.../insights/service/GeminiService.java` | New 4-section parent report prompt |
| `apps/mobile/src/components/MoodCheckIn.tsx` | Refactored with server-side dedup, new design |
| `apps/mobile/src/screens/DashboardScreen.tsx` | Added motivation card + mood check-in + celebration |
| `apps/mobile/src/navigation/AppNavigator.tsx` | Added Study Buddy tab |
| `apps/web-app/src/lib/insights.ts` | New types + API helpers |
| `apps/web-app/src/app/parent/control/page.tsx` | Added AI suggestions panel |
| `apps/web-app/src/app/parent/insights/page.tsx` | Added mood chart + topic summary row |
