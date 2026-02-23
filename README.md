# KAVACH AI 🛡️

> Computer Lab Discipline & Student Safety Monitoring Platform — Built for Indian schools and coaching institutes 🇮🇳

---

## Architecture

| Layer | Technology | Purpose |
|---|---|---|
| **Desktop Agent** | Electron + TypeScript | Monitors Windows/Mac devices |
| **Web Dashboard** | Next.js + React (PWA) | Parent / Institute / Student UI |
| **Mobile Agent** | React Native *(Future)* | Mobile device monitoring |
| **Backend** | Spring Boot + Java 17 | REST API + WebSocket |
| **Database** | PostgreSQL 15 | Multi-tenant data store |
| **Monorepo** | pnpm + Turborepo | Unified workspace |

---

## Prerequisites

Install all of these before starting:

| Tool | Version | Install |
|---|---|---|
| **Java (JDK)** | 17+ (21 recommended) | `brew install openjdk@21` |
| **Maven** | 3.9+ | `brew install maven` |
| **Node.js** | 18+ (24 recommended) | `brew install node` |
| **pnpm** | 9+ | `npm install -g pnpm` |
| **PostgreSQL** | 15 | `brew install postgresql@15` |

---

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env with your values
docker compose up -d
# App available at http://localhost:3000
# API available at http://localhost:8080
```

## Quick Start (Local Dev)

```bash
# Terminal 1: Database
docker compose up postgres -d

# Terminal 2: Backend
cd backend && ./mvnw spring-boot:run

# Terminal 3: Frontend
cd apps/web-app && pnpm dev

# Terminal 4: Desktop Agent (optional)
cd apps/desktop-agent && pnpm dev
```

---

## Complete Local Setup (Step by Step)

### Step 1 — Clone & Install Dependencies

```bash
git clone <repo-url>
cd Kavach-Core

# Install all JS/TS dependencies across the monorepo
pnpm install
```

---

### Step 2 — Start PostgreSQL

```bash
# Start the PostgreSQL service
brew services start postgresql@15

# Verify it's running
brew services list | grep postgresql
```

---

### Step 3 — Create the Database & User

```bash
psql postgres
```

Inside the psql shell, run:

```sql
CREATE USER kavach WITH PASSWORD 'kavach123';
CREATE DATABASE kavach_db OWNER kavach;
GRANT ALL PRIVILEGES ON DATABASE kavach_db TO kavach;
\q
```

> ✅ Flyway will automatically run all migrations (`V1` → `V14`) on first backend startup — no manual SQL needed.

---

### Step 4 — Configure the Web App

Create the env file for the Next.js app:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > apps/web-app/.env.local
```

---

### Step 5 — (Optional) Configure Backend Secrets

The backend works out-of-the-box with defaults for local dev. To override, set these environment variables **before** running the backend:

```bash
# Database (defaults already match Step 3)
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/kavach_db
export SPRING_DATASOURCE_USERNAME=kavach
export SPRING_DATASOURCE_PASSWORD=kavach123

# JWT — change this in production!
export JWT_SECRET=kavach-jwt-secret-key-minimum-256-bits-long-change-in-production-2024

# AI Insights (optional — leave blank to disable)
export GEMINI_API_KEY=your_gemini_api_key_here

# Payments (optional — use test keys for local)
export RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
export RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

---

### Step 6 — Run Everything

Open **3 separate terminal tabs/windows**:

**Terminal 1 — Backend (Spring Boot)**
```bash
cd backend
mvn spring-boot:run
# ✅ Ready when you see: Started KavachApplication on port 8080
```

**Terminal 2 — Web App (Next.js)**
```bash
pnpm dev:web
# ✅ Ready at http://localhost:3000
```

**Terminal 3 — Desktop Agent (Electron)**
```bash
pnpm dev:desktop
# ✅ Electron window opens
```

---

### Step 7 — Verify Everything is Running

| Service | URL | Expected |
|---|---|---|
| **Web App** | http://localhost:3000 | Login page |
| **Backend API** | http://localhost:8080/actuator/health | `{"status":"UP"}` |
| **Swagger Docs** | http://localhost:8080/swagger-ui.html | API explorer |

---

## Demo Credentials

All demo accounts use password: **`demo123`**

| Role | Email | Access |
|---|---|---|
| 🏫 Institute Admin | `admin@demo.com` | Full institute dashboard |
| 👨‍👩‍👧 Parent | `parent@demo.com` | Child monitoring & alerts |
| 🎓 Student | `student@demo.com` | Focus mode & goals |

---

## Project Structure

```
Kavach-Core/
├── apps/
│   ├── web-app/          # Next.js dashboard (port 3000)
│   ├── desktop-agent/    # Electron monitoring agent
│   └── mobile-agent/     # React Native (future)
├── backend/              # Spring Boot API (port 8080)
│   ├── src/main/java/com/kavach/
│   │   ├── auth/         # JWT authentication
│   │   ├── dashboard/    # Dashboard APIs
│   │   ├── devices/      # Device management
│   │   ├── alerts/       # Alert rules & triggers
│   │   ├── focus/        # Focus mode sessions
│   │   ├── goals/        # Student goals
│   │   ├── insights/     # AI insights (Claude)
│   │   ├── blocking/     # URL/app blocking
│   │   └── tenants/      # Multi-tenancy
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/ # Flyway SQL migrations (V1–V14)
├── package.json          # Root pnpm workspace
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Common Issues & Fixes

### ❌ Backend won't start — port 8080 already in use
```bash
lsof -ti:8080 | xargs kill -9
```

### ❌ PostgreSQL connection refused
```bash
brew services restart postgresql@15
# Then verify:
psql -U kavach -d kavach_db -c "SELECT 1;"
```

### ❌ Flyway migration error on clean reset
```bash
# Drop and recreate the DB, then restart backend
psql postgres -c "DROP DATABASE kavach_db;"
psql postgres -c "CREATE DATABASE kavach_db OWNER kavach;"
cd backend && mvn spring-boot:run
```

### ❌ `pnpm install` fails
```bash
# Make sure you're using pnpm v9+
npm install -g pnpm@latest
pnpm install
```

### ❌ Desktop agent won't open
```bash
pnpm --filter desktop-agent install
pnpm dev:desktop
```

---

## Useful Commands

```bash
# Run web + desktop together via Turborepo
pnpm dev

# Run only web app
pnpm dev:web

# Run only desktop agent
pnpm dev:desktop

# Run backend
pnpm dev:backend        # uses ./mvnw spring-boot:run
# OR directly:
cd backend && mvn spring-boot:run

# Build everything
pnpm build

# Check all lints
pnpm lint
```

---

## Pricing

| Plan | Price | Devices |
|---|---|---|
| **Starter** | ₹100/device/month | Up to 50 |
| **Institute** | ₹150/device/month | Up to 300 |
| **Enterprise** | Custom pricing | Unlimited |
