# KAVACH AI Deployment Audit

## Summary
- Total issues found: 15
- Blockers (must fix before deploy): 6
- Warnings (should fix): 6
- Info (nice to have): 3

## 🔴 BLOCKERS

1. **Hardcoded localhost fallbacks for API URLs (Frontend, Mobile, Desktop)**
   - **Files**
     - `apps/web-app/src/lib/axios.ts` — `API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'`
     - `apps/web-app/src/hooks/useSSE.ts` — `(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(...)`
     - `apps/web-app/src/app/institute/reports/page.tsx` — `const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";`
     - `apps/web-app/src/app/parent/reports/page.tsx` — `const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'`
     - `packages/shared-constants/src/index.ts` — `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";`
     - `apps/mobile/src/lib/axios.ts` — `BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://10.0.2.2:8080/api/v1'`
     - `apps/desktop-agent/src/auth/config.ts` — `apiUrl: process.env.API_URL || 'http://localhost:8080'`
   - **Issue**
     - In production, these fallbacks would point to non-existent localhost instances instead of the Render backend / Neon DB behind HTTPS.
   - **Required change**
     - Ensure production environments (Vercel, Expo EAS, Electron build) **always** set:
       - `NEXT_PUBLIC_API_URL` (Vercel)
       - `EXPO_PUBLIC_API_URL` (Expo EAS)
       - `API_URL` (Electron desktop agent)
     - Treat the localhost defaults as **dev-only**; document that they MUST be overridden in production.
   - **Env vars**
     - `NEXT_PUBLIC_API_URL`, `EXPO_PUBLIC_API_URL`, `API_URL`

2. **JWT secret default contains a long hardcoded value**
   - **File**
     - `backend/src/main/resources/application.yml`  
       - `kavach.jwt.secret: ${JWT_SECRET:kavach-jwt-secret-key-minimum-256-bits-long-change-in-production-2024}`
   - **Issue**
     - A strong-looking default secret is embedded in config; if `JWT_SECRET` is not set on Render, production will use this shared value.
   - **Required change**
     - Treat this only as a **local dev** default and clearly document that `JWT_SECRET` **must** be set in Render.
     - For higher safety, remove/shorten the default and rely on `env.example` guidance.
   - **Env var**
     - `JWT_SECRET`

3. **Razorpay secrets with non-empty-looking defaults in YAML**
   - **File**
     - `backend/src/main/resources/application.yml`
       - `razorpay.key.id: ${RAZORPAY_KEY_ID:rzp_test_XXXXXXXXXXXXXXXX}`
       - `razorpay.key.secret: ${RAZORPAY_KEY_SECRET:XXXXXXXXXXXXXXXXXXXXXXXX}`
       - `razorpay.webhook.secret: ${RAZORPAY_WEBHOOK_SECRET:YOUR_WEBHOOK_SECRET_HERE}`
   - **Issue**
     - Test-like and placeholder secrets are present as defaults; in production on Render these must be overridden to real secrets, never used as-is.
   - **Required change**
     - Document that Razorpay keys **must** be provided via env vars in production and never rely on YAML defaults.
     - Optionally change defaults to empty strings and fail-fast if not set in `prod` profile.
   - **Env vars**
     - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

4. **Flyway baseline-on-migrate enabled for production**
   - **File**
     - `backend/src/main/resources/application.yml`
       - `spring.flyway.baseline-on-migrate: true`
   - **Issue**
     - On Render free tier with Neon, repeated restarts plus `baseline-on-migrate=true` can hide schema drift and complicate migration history.
   - **Required change**
     - For the `prod` profile, set `spring.flyway.baseline-on-migrate=false` and rely on a clean migration history on Neon.
   - **Env/config**
     - Adjust `application-prod.yml` or a `prod`-specific Flyway config.

5. **No Hikari connection pool tuning for Neon serverless**
   - **Finding**
     - No `spring.datasource.hikari.*` configuration in any YAML or Java file.
   - **Issue**
     - Neon free tier allows limited connections; default Hikari settings may open too many connections or time out poorly on a serverless backend.
   - **Required change**
     - Add explicit Hikari settings tuned for Neon:
       - `spring.datasource.hikari.maximum-pool-size=5`
       - `spring.datasource.hikari.connection-timeout=30000`
       - (Optionally) `spring.datasource.hikari.idle-timeout` and `max-lifetime` tuned for Neon.
   - **Env/config**
     - In `application.yml` or `application-prod.yml`, or via env vars.

6. **Electron desktop agent lacks auto-updater and GitHub Releases config**
   - **Files**
     - `apps/desktop-agent/package.json`
       - No `electron-updater` dependency
       - No `build`/`publish` config for GitHub Releases in `electron-builder`
   - **Issue**
     - Without auto-update, shipped desktop agents will not receive rule/policy engine fixes, creating long-lived insecure clients.
   - **Required change**
     - Add `electron-updater` and configure `electron-builder` `publish` to GitHub Releases.
     - Wire updater into `main.ts` for update checks on startup and periodic checks.

## 🟡 WARNINGS

1. **CORS defaults only include localhost**
   - **Files**
     - `backend/src/main/resources/application.yml`  
       - `spring.security.cors.allowed-origins: ${CORS_ORIGINS:http://localhost:3000,http://localhost:3001}`
     - `backend/src/main/java/com/kavach/security/SecurityConfig.java`  
       - `CORS_ORIGINS` env default: `"http://localhost:3000,http://localhost:3001"`
   - **Issue**
     - Production Vercel domains are not whitelisted by default.
   - **Recommended fix**
     - In Render env, set `CORS_ORIGINS` to include:
       - `https://*.vercel.app`
       - Any custom parent dashboard domains.

2. **Neon/Render JVM memory tuning missing**
   - **Finding**
     - No `JAVA_OPTS` / `MAVEN_OPTS` or JVM memory flags in repo.
   - **Issue**
     - Render free tier has 512MB RAM; default JVM heap may be too large under load.
   - **Recommended fix**
     - Configure Render service with:
       - `JAVA_OPTS=-Xmx400m -Xss512k`

3. **Initial migrations use `CREATE TABLE` without `IF NOT EXISTS`**
   - **Files**
     - `backend/src/main/resources/db/migration/V1__init.sql`
     - Several early migrations (e.g., `V3__add_tasks_achievements_insights.sql`, `V5__devices_schema.sql`, etc.)
   - **Issue**
     - On failed/partial migrations, re-running could error on existing tables.
   - **Mitigation already present**
     - Later migrations (`V11__auth_schema.sql`, `V19+`) start using `CREATE TABLE IF NOT EXISTS`.
   - **Recommended fix**
     - For Neon, ensure Flyway is not re-baselined; treat this as acceptable but document that the DB must start from a clean state.

4. **Demo seed data migrations run in base profile**
   - **Files**
     - `backend/src/main/resources/db/migration/V2__seed_demo_data.sql`
     - `backend/src/main/resources/db/migration/V11__auth_schema.sql` (contains demo academy and demo users)
     - Cleanup: `backend/src/main/resources/db/migration/V26__remove_demo_seed_data.sql`
   - **Issue**
     - Demo tenant and users are seeded and later deleted; in production this is unnecessary noise.
   - **Recommended fix**
     - For new environments, consider marking V2/V11 as **dev-only** via Flyway locations or profiles.
     - For Neon production, the presence then deletion is functionally OK but should be documented.

5. **`next.config.js` exposes `output: 'standalone'` via env**
   - **File**
     - `apps/web-app/next.config.js`  
       - `output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined`
   - **Issue**
     - Vercel does not require standalone output; this is only relevant for Docker.
   - **Recommended fix**
     - Ensure `NEXT_OUTPUT` is **not** set in Vercel, or delete this setting if not needed.

6. **Expo EAS projectId placeholder**
   - **File**
     - `apps/mobile/app.json`
       - `extra.eas.projectId: "YOUR_EAS_PROJECT_ID"`
   - **Issue**
     - EAS builds will fail until this is replaced by a real project ID.
   - **Recommended fix**
     - Before first EAS production build, set a real `projectId` in `app.json` or via EAS config.

## 🟢 INFO

1. **Backend port binding is Render-ready**
   - **File**
     - `backend/src/main/resources/application.yml`
       - `server.port: ${PORT:8080}`
   - **Note**
     - This satisfies Render’s dynamic `PORT` requirement; just set `PORT` in Render env (or let Render inject it).

2. **Health endpoint is exposed and allowed unauthenticated**
   - **Files**
     - `backend/src/main/resources/application-prod.yml` — `management.endpoints.web.exposure.include: health`
     - `backend/src/main/java/com/kavach/security/SecurityConfig.java` — `/actuator/health` in `permitAll()`
   - **Note**
     - Render can use `/actuator/health` for health checks without authentication.

3. **JWT expiry configuration matches security guidance**
   - **File**
     - `backend/src/main/resources/application.yml`
       - `kavach.jwt.access-token-expiry: ${JWT_ACCESS_EXPIRY:900000}` (15 min)
       - `kavach.jwt.refresh-token-expiry: ${JWT_REFRESH_EXPIRY:604800000}` (7 days)
   - **Note**
     - Meets the requested expiry policy; ensure these are not loosened in production.

## Environment Variables Required

### Backend (Render)

- **SPRING_DATASOURCE_URL / SPRING_DATASOURCE_USERNAME / SPRING_DATASOURCE_PASSWORD**
  - Neon PostgreSQL JDBC URL and credentials. Must point to Neon pooler endpoint (e.g., `jdbc:postgresql://<neon-host>/<db>`).
- **PORT**
  - Render-provided port; already wired as `server.port=${PORT:8080}`.
- **JWT_SECRET**
  - Strong HS256 secret (`>= 32` chars) for access/refresh token signing.
- **JWT_ACCESS_EXPIRY**
  - Access token TTL in ms (default 900000).
- **JWT_REFRESH_EXPIRY**
  - Refresh token TTL in ms (default 604800000).
- **CORS_ORIGINS**
  - Comma-separated list of allowed origins, including Vercel domains and any custom domains.
- **GEMINI_API_KEY**
  - Google Gemini key for AI insights (`kavach.ai.gemini.api-key`); required to enable production AI features. Code fails fast in prod if missing.
- **R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME**
  - Cloudflare R2 (or S3-compatible) storage credentials and bucket name for screenshots.
- **RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET / RAZORPAY_WEBHOOK_SECRET**
  - Razorpay live keys and webhook secret for subscription billing (if payments enabled).

### Frontend (Vercel)

- **NEXT_PUBLIC_API_URL**
  - Base backend URL (no trailing slash, no `/api/v1`), e.g. `https://api.your-domain.com`.
  - Used by `apps/web-app/src/lib/axios.ts`, reports pages, and SSE hooks.
- **NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS**
  - `false` in production. Controls whether demo login credentials are shown on `/login`.
- **NEXT_PUBLIC_APP_NAME**
  - Branding string for UI.
- **NEXT_OUTPUT**
  - Should be **unset** on Vercel; `standalone` is only for Docker builds.

### Desktop Agent (Electron)

- **API_URL**
  - Backend base URL for desktop agent, e.g. `https://api.your-domain.com`.
  - Used in `apps/desktop-agent/src/auth/config.ts` and downstream sync modules.
- **(Future) Auto-updater / GitHub Releases**
  - GitHub token/config will be required in CI to publish releases; out of scope for codebase but must be present in pipeline.

### Mobile (Expo EAS)

- **EXPO_PUBLIC_API_URL**
  - Backend API base URL including `/api/v1`, e.g. `https://api.your-domain.com/api/v1`. Used by `apps/mobile/src/lib/axios.ts`.
- **EXPO_PUBLIC_TRACKING_INTERVAL**
  - Background enforcement poll interval in ms (default 15000).
- **EXPO_PUBLIC_DEBUG**
  - `false` in production to reduce console noise and potential information leakage.

## Pre-Deployment Checklist

- [ ] All blockers fixed
- [ ] Environment variables set in Render dashboard:
  - `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
  - `PORT`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
  - `CORS_ORIGINS`, `GEMINI_API_KEY`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
  - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- [ ] Environment variables set in Vercel dashboard:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false`
  - `NEXT_PUBLIC_APP_NAME`
  - `NEXT_OUTPUT` **not** set
- [ ] Environment variables set for Desktop Agent build environment:
  - `API_URL` pointing to Render backend
- [ ] Environment variables set for Expo EAS:
  - `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_TRACKING_INTERVAL`, `EXPO_PUBLIC_DEBUG=false`
  - `app.json` `extra.eas.projectId` set to real EAS project ID
- [ ] Neon database provisioned and URL copied into `SPRING_DATASOURCE_URL`
- [ ] Flyway migrations run successfully on Neon (from V1 through V26 with no gaps)
- [ ] CORS updated to include Vercel domain(s) and any custom domains via `CORS_ORIGINS`
- [ ] Backend health check (`/actuator/health`) passing on Render
- [ ] Frontend build passing on Vercel (`pnpm build` succeeds)
- [ ] Electron desktop agent build and signed binaries published to GitHub Releases
- [ ] Expo EAS Android build completes and installs successfully with correct API connectivity

