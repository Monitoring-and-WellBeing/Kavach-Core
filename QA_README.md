# QA Review Documentation

Brief change log. Each entry ends at **Test cases** only.

---

## Entry 001 - Backend Local Datasource Alignment

### Feature / Change Summary
- Local datasource and Flyway defaults were aligned to local Postgres.

### What was implemented
- `application.yml` fallback DB set to `jdbc:postgresql://localhost:5432/kavach_db`, user `kavach`, password `kavach123`.
- `backend/pom.xml` Flyway plugin defaults updated to same local DB values.

### Files changed
- `backend/src/main/resources/application.yml`
- `backend/pom.xml`

### How it works
- App and Flyway now target the same local DB when env vars are not set.

### How to test it
- Run `pnpm dev:backend`.
- Verify `http://localhost:8080/actuator/health` returns UP.
- Run `mvn -f backend/pom.xml flyway:info`.

### Known limitations
- Local fallback credentials are dev-only and must be overridden in production.

### Test cases
Test Case:
- Input: Local Postgres running with `kavach_db` and `kavach/kavach123`.
- Expected Output: Backend starts and health is UP.

Test Case:
- Input: Override `SPRING_DATASOURCE_URL` via env.
- Expected Output: App uses override without startup failure.

Test Case:
- Input: Postgres stopped.
- Expected Output: Backend startup fails with DB connection/auth error.

---

## Entry 002 - Backend Startup Reliability (Windows)

### Feature / Change Summary
- Backend run command and local-safe secret fallbacks were adjusted to prevent startup failures.

### What was implemented
- `package.json` `dev:backend` changed to `mvn -f backend/pom.xml spring-boot:run`.
- `application.yml` updated with local datasource fallbacks.
- Non-empty local placeholders added for `r2.*` and `razorpay.*` values.
- Flyway history was repaired once in local environment.

### Files changed
- `package.json`
- `backend/src/main/resources/application.yml`

### How it works
- `pnpm dev:backend` runs Maven directly from root.
- Required config keys get non-empty local fallback values for local startup.

### How to test it
- Run `pnpm dev:backend`.
- Run `Invoke-RestMethod http://localhost:8080/actuator/health | ConvertTo-Json -Compress`.
- Smoke-test one authenticated API endpoint.

### Known limitations
- Requires `mvn` on PATH (wrapper not used by this script).
- Placeholder secrets are local-only and not valid production secrets.

### Test cases
Test Case:
- Input: Windows machine with Maven installed; run `pnpm dev:backend`.
- Expected Output: Backend boots and health endpoint returns UP.

Test Case:
- Input: Start backend without `R2_*` and `RAZORPAY_*` env vars.
- Expected Output: Startup succeeds using placeholder fallbacks.

Test Case:
- Input: Remove Maven from PATH and run `pnpm dev:backend`.
- Expected Output: Command fails with `mvn` not found.
