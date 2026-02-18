# KAVACH AI 🛡️

> Computer Lab Discipline & Student Safety Monitoring Platform

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Agent | Electron + TypeScript | Monitors Windows devices |
| Web Dashboard | Next.js + React (PWA) | Parent/Institute/Student UI |
| Mobile Agent | React Native (Future) | Mobile device monitoring |
| Backend | Spring Boot + Java 17 | REST API + WebSocket |
| Database | PostgreSQL 15 | Multi-tenant data store |
| Monorepo | pnpm + Turborepo | Unified workspace |

## Quick Start

```bash
./scripts/bootstrap.sh
pnpm dev:web      # Dashboard at localhost:3000
pnpm dev:backend  # API at localhost:8080
```

## Demo Credentials

- Parent: parent@demo.com / demo123
- Student: student@demo.com / demo123
- Institute Admin: admin@demo.com / demo123

## Pricing

- Starter: ₹100/device/month (up to 50 devices)
- Institute: ₹150/device/month (up to 300 devices)
- Enterprise: Custom

Built for Indian schools and coaching institutes 🇮🇳
