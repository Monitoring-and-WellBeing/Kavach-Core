# Frontend Production Deployment — Issues & Fixes Log

**Date:** March 15, 2026
**Branch:** `dev`
**Commits:** `a8d352e` → `117e514` → `e497621`
**Scope:** Web-app production readiness audit + backend CORS fix + merge conflict resolution

---

## Overview

After the backend was successfully deployed and live at `https://kavach-core-production.up.railway.app`, we performed a full production audit of the `apps/web-app` frontend and the backend's CORS configuration before deploying to Vercel.

The audit uncovered **5 critical production blockers** that would have caused broken auth, infinite redirect loops, and CORS errors in production. All were fixed, committed, and merged into `dev`.

---

## Part 1 — Frontend Production Blockers

### Blocker 1: SSR Crash — `localStorage` in Server Context

**File:** `apps/web-app/src/lib/axios.ts`
**Severity:** 🔴 Critical — App crashes on first render

**Problem:**
```ts
// BEFORE — crashes during Next.js server-side rendering
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kavach_access_token') // ReferenceError on server
  ...
})
```

`localStorage` does not exist in the Node.js server environment. Next.js pre-renders pages server-side, so any component that triggers this interceptor on mount would throw `ReferenceError: localStorage is not defined` and crash the entire page.

Additionally, the 401 error handler called `localStorage.clear()` which wiped ALL browser storage (wiped unrelated data) and used `window.location.href = '/'` without a guard — also a server crash.

**Fix:**
```ts
// AFTER — SSR-safe, guarded by window check
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('kavach_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 handler — SSR guard + surgical token clear + /login redirect with loop guard
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      if (typeof window !== 'undefined') {
        // ... refresh logic ...
        // On failure: only remove auth tokens, not all localStorage
        localStorage.removeItem('kavach_access_token')
        localStorage.removeItem('kavach_refresh_token')
        localStorage.removeItem('kavach_user_profile')
        // Guard against infinite redirect loop on the login page itself
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
  }
)
```

Also added `timeout: 10000` and typed the instance as `AxiosInstance`.

---

### Blocker 2: Logout Was Completely Broken

**Files:** `apps/web-app/src/lib/auth.ts`, `apps/web-app/src/components/layout/Sidebar.tsx`, `apps/web-app/src/components/layout/TopBar.tsx`
**Severity:** 🔴 Critical — Clicking "Logout" did nothing in production

**Problem:**
The codebase had two parallel auth systems:

| System | Token key used | Set by |
|---|---|---|
| **Real auth** (`AuthContext.tsx` + `axios.ts`) | `kavach_access_token`, `kavach_refresh_token` | `AuthContext` on login |
| **Legacy demo auth** (`auth.ts`) | `kavach_token` | Never set in production |

`Sidebar.tsx` and `TopBar.tsx` both called `logout()` from the **legacy** `auth.ts`:
```ts
// auth.ts (legacy) — only cleared the wrong key
export function logout() {
  sessionStorage.removeItem("kavach_user")
  localStorage.removeItem("kavach_token")  // ← wrong key, never set by real auth
  window.location.href = "/"
}
```

This meant clicking "Logout" did nothing — the real session tokens (`kavach_access_token`, `kavach_refresh_token`) were never cleared. The user remained "logged in" even after clicking logout.

**Fix — `auth.ts` rewritten:**
```ts
// Clears all token keys — current AND legacy — plus cached profile
export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem("kavach_access_token")
  localStorage.removeItem("kavach_refresh_token")
  localStorage.removeItem("kavach_token")        // legacy key — clear for safety
  localStorage.removeItem("kavach_user_profile")
  sessionStorage.removeItem("kavach_user")
  window.location.href = "/"
}
```

**Fix — `Sidebar.tsx` and `TopBar.tsx`:**
Replaced the legacy `logout` import with `useAuth().logout` from `AuthContext`:
```ts
// BEFORE
import { logout } from "@/lib/auth"
// ...
<button onClick={logout}>Logout</button>

// AFTER
import { useAuth } from "@/context/AuthContext"
// ...
const { logout } = useAuth()
// ...
<button onClick={logout}>Logout</button>
```

This ensures logout calls the real async logout (which also hits `/auth/logout` on the backend to invalidate the server-side session).

---

### Blocker 3: RoleGuard Always Redirected to Login

**Files:** `apps/web-app/src/components/layout/RoleGuard.tsx`, `apps/web-app/src/lib/role-guard.tsx`
**Severity:** 🔴 Critical — All protected pages were inaccessible

**Problem:**
Both `RoleGuard` components called `getStoredUser()` from the legacy `auth.ts`:
```ts
// RoleGuard.tsx (old)
useEffect(() => {
  const user = getStoredUser()   // reads sessionStorage["kavach_user"]
  if (!user) {
    router.push("/login")        // ← ALWAYS redirects, session key never set
  }
}, [])
```

`getStoredUser()` read from `sessionStorage["kavach_user"]` using **demo hardcoded names** (`Rajesh Kumar`, `Rahul Sharma`). `AuthContext.tsx` never sets this sessionStorage key — it stores tokens in `localStorage`. So in production:
- User logs in via real backend ✅
- Navigates to `/parent/devices` ❌
- `RoleGuard` calls `getStoredUser()` → reads `sessionStorage["kavach_user"]` → `null`
- Immediately redirects to `/login` → infinite loop

**Fix — rewrote both guards to use `useAuth()`:**
```ts
// RoleGuard.tsx (new) — uses real auth context
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth()    // reads real session state
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return                  // wait for /auth/me to resolve
    if (!user) {
      router.push('/')
    } else if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.push('/')
    } else {
      setChecking(false)                 // only render children when confirmed
    }
  }, [user, loading, allowedRoles, router])

  if (loading || checking) return <Spinner />  // show loader, not blank page
  return <>{children}</>
}
```

---

### Blocker 4: User Profile Not Cached After Login

**File:** `apps/web-app/src/context/AuthContext.tsx`
**Severity:** 🟡 Medium — `getStoredUser()` helpers couldn't read real user

**Problem:**
`AuthContext` stored tokens on login but never cached the user profile object:
```ts
// BEFORE — only tokens stored
localStorage.setItem('kavach_access_token', data.accessToken)
localStorage.setItem('kavach_refresh_token', data.refreshToken)
// user profile was only in React state — lost on page refresh
```

**Fix:**
```ts
// AFTER — also cache user profile
localStorage.setItem('kavach_access_token', data.accessToken)
localStorage.setItem('kavach_refresh_token', data.refreshToken)
localStorage.setItem('kavach_user_profile', JSON.stringify(data.user))  // ← added
```

Same on signup and on the `/auth/me` session restore. On logout, `kavach_user_profile` is also cleared:
```ts
localStorage.removeItem('kavach_user_profile')
```

---

### Blocker 5: No `.env.production` File

**File:** `apps/web-app/.env.production` (new file)
**Severity:** 🔴 Critical — App defaulted to `localhost:8080` in production build

**Problem:**
Both `api.ts` and `axios.ts` had:
```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
```

Without a `.env.production` file, `NEXT_PUBLIC_API_URL` was `undefined` at build time. The built app would call `http://localhost:8080` — which doesn't exist on Vercel.

**Fix — created `apps/web-app/.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://kavach-core-production.up.railway.app/api/v1
NEXT_PUBLIC_WS_URL=wss://kavach-core-production.up.railway.app/ws
NEXT_PUBLIC_APP_NAME=KAVACH AI
NEXT_PUBLIC_ENABLE_AI_INSIGHTS=true
NEXT_PUBLIC_ENABLE_FOCUS_MODE=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

> **Note:** `NEXT_PUBLIC_*` vars are baked into the client bundle at build time. Set them in the Vercel dashboard under **Settings → Environment Variables** for the deployment environment.

---

## Part 2 — Backend CORS Fix

### Issue: CORS Origins Were Hardcoded — `CORS_ORIGINS` Env Var Was Ignored

**File:** `backend/src/main/java/com/kavach/security/SecurityConfig.java`
**Severity:** 🔴 Critical — Vercel frontend would be blocked by CORS on every API call

**Problem:**
`application.yml` had `${CORS_ORIGINS:...}` configured correctly, but `SecurityConfig.java` **completely ignored it** — the CORS configuration was hardcoded:
```java
// BEFORE — hardcoded, ignores CORS_ORIGINS env var entirely
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "http://localhost:3001",
    "capacitor://localhost",
    "ionic://localhost"
));
```

No matter what you set in Railway's `CORS_ORIGINS` env var, the backend would only ever allow localhost origins. Every request from the Vercel frontend would receive a CORS 403.

**Fix — read origins from `@Value`:**
```java
// AFTER — driven by env var
@Value("${spring.security.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
private String corsOriginsRaw;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    List<String> allowedOrigins = Arrays.stream(corsOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();

    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(allowedOrigins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L); // Cache preflight for 1 hour
    ...
}
```

**Additional improvements in `SecurityConfig.java`:**
- Added security response headers: `HSTS`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Content-Security-Policy`
- Added `RequestIdFilter` to the filter chain for request tracing
- Added all device/agent endpoints to the `permitAll` list (desktop agent and mobile agent authenticate via `deviceId`, not JWT):
  - `/api/v1/enforcement/**` — desktop enforcement engine
  - `/api/v1/location/**` — mobile GPS updates
  - `/api/v1/screenshots/upload` — desktop screenshot upload
  - `/api/v1/sse/device/**` — SSE channel for desktop agent
  - `/api/v1/devices/*/heartbeat` — device keep-alive

---

## Part 3 — `application.yml` Consolidation

**File:** `backend/src/main/resources/application.yml`

Merged improvements from both the `Quality-Stability` branch and the `dev` branch:

| Section | What was added/fixed |
|---|---|
| `datasource` | Neon DB pooler URL as default, explicit warnings on credential fallbacks |
| `datasource.hikari` | Full pool config: `max-pool-size=5`, `min-idle=1`, `keepalive-time=300000` |
| `flyway` | `out-of-order: false`, `validate-on-migrate: true` |
| `security.cors` | Comment documenting the `CORS_ORIGINS` env var format |
| `kavach.ai` | Gemini provider config with `api-key: ${GEMINI_API_KEY:}` |
| `r2` | Cloudflare R2 config for screenshot storage |
| `razorpay` | Payment gateway config with explicit warnings on test keys |
| `management` | Actuator endpoint exposure: `health`, `info`, `metrics` |
| `springdoc` | Explicitly `enabled: true` to ensure Swagger loads in all profiles |

---

## Part 4 — Merge Conflict Resolution

### What Happened

During development, two branches diverged significantly:
- **Local `dev`:** Had our frontend prod-blocker fixes (`a8d352e`)
- **Remote `dev`:** Had the Quality-Stability backend audit + Swagger fixes + Railway deployment fixes (merged via `Quality-Stability` branch)

When we tried to push our fixes, git rejected it because local was behind remote by ~10 commits.

### Conflicts Encountered

| File | Conflict Type | Root Cause |
|---|---|---|
| `axios.ts` | Both sides modified | Remote had typed `AxiosInstance` + timeout; local had SSR fix |
| `auth.ts` | Delete/modify conflict | Remote **deleted** the file; we kept and rewrote it |
| `RoleGuard.tsx` | Both sides modified | Both sides rewrote the component differently |
| `role-guard.tsx` | Both sides modified | Same as above |
| `SecurityConfig.java` | Both sides modified | Remote added security headers + agent endpoints; local added `@Value` CORS |
| `application.yml` | Both sides modified | Remote had Quality-Stability fixes; local had new config sections |

### Resolution Strategy

For each conflict, we took the **best of both sides**:
- `axios.ts` — kept remote's typed signature + timeout + our SSR guards + `/login` redirect loop guard
- `auth.ts` — **kept our version** (remote deleted it but our rewrite was correct)
- `RoleGuard.tsx` — kept our `useAuth()` + `checking` state version
- `SecurityConfig.java` — merged: remote's security headers + agent endpoints + our `@Value` CORS parsing
- `application.yml` — merged all new sections from both sides into one clean file

### Resolution Commands Used

```bash
# 1. Attempted rebase — got conflicts
git pull --rebase origin dev

# 2. Abort was needed multiple times due to stale rebase state
rm -fr .git/rebase-merge
git rebase --abort

# 3. Final approach — standard merge
git merge origin/dev --no-edit
# → wrote final clean versions of all conflicted files
# → git add <all resolved files>
# → git commit (merge commit e497621)

# 4. Push succeeded
git push origin dev
# → 4576dea..e497621  dev -> dev
```

---

## Part 5 — Deployment Checklist

### Vercel (Frontend)

| Step | Action |
|---|---|
| Root Directory | `apps/web-app` |
| Framework | Next.js (auto-detected) |
| Build Command | `next build` (default) |
| Env Var | `NEXT_PUBLIC_API_URL` = `https://kavach-core-production.up.railway.app/api/v1` |

### Railway (Backend — after Vercel URL is known)

Set in Railway → Kavach-Core → **Variables** tab:

```
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-git-dev.vercel.app,http://localhost:3000
```

Railway will auto-redeploy on env var change. The backend will immediately start accepting requests from the Vercel domain.

---

## Summary of All Files Changed

| File | Change |
|---|---|
| `apps/web-app/src/lib/axios.ts` | SSR-safe interceptors, `/login` redirect guard, typed instance, 10s timeout |
| `apps/web-app/src/lib/auth.ts` | Rewrote: `logout()` clears all token keys; `getStoredUser()` reads real localStorage |
| `apps/web-app/src/context/AuthContext.tsx` | Cache `kavach_user_profile` to localStorage on login/signup/restore; clear on logout |
| `apps/web-app/src/components/layout/RoleGuard.tsx` | Rewrote: use `useAuth()` + `checking` state + spinner while verifying |
| `apps/web-app/src/lib/role-guard.tsx` | Rewrote: use `useAuth()` replacing legacy `getStoredUser()` |
| `apps/web-app/src/components/layout/Sidebar.tsx` | Use `useAuth().logout` instead of legacy `auth.ts` logout |
| `apps/web-app/src/components/layout/TopBar.tsx` | Use `useAuth().logout`; replaced `<a>` with `<Link>` for Next.js routing |
| `apps/web-app/.env.production` | New file: `NEXT_PUBLIC_API_URL` pointing to Railway backend |
| `backend/src/main/java/com/kavach/security/SecurityConfig.java` | `@Value` CORS, security headers, `RequestIdFilter`, agent endpoints |
| `backend/src/main/resources/application.yml` | Neon DB, Hikari, Flyway, AI/Gemini, R2, Razorpay, actuator, springdoc |

---

## Commits

| Hash | Message |
|---|---|
| `a8d352e` | fix: frontend prod blockers - SSR safety, logout, RoleGuard, CORS env-driven |
| `117e514` | fix: merge prod-blockers into dev — resolve all conflicts |
| `e497621` | fix: merge remote dev into local — resolve all conflicts cleanly |
