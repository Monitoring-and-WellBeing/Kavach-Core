#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KAVACH AI — Bootstrap Script
# Sets up all dependencies and starts the development environment
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 Setting up KAVACH AI monorepo..."
echo ""

# ── Check prerequisites ────────────────────────────────────────
echo "🔍 Checking prerequisites..."

if ! command -v node &>/dev/null; then
    echo "❌ Node.js is required. Install from: https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "  ✓ Node.js $NODE_VERSION"

if ! command -v pnpm &>/dev/null; then
    echo "  ℹ️  Installing pnpm..."
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
echo "  ✓ pnpm $PNPM_VERSION"

if ! command -v java &>/dev/null; then
    echo "❌ Java 17+ is required. Install from: https://adoptium.net"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -1)
echo "  ✓ Java: $JAVA_VERSION"

if ! command -v docker &>/dev/null; then
    echo "❌ Docker is required. Install from: https://docker.com"
    exit 1
fi
echo "  ✓ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')"

echo ""

# ── Install JS dependencies ────────────────────────────────────
echo "📦 Installing JavaScript dependencies..."
pnpm install
echo "  ✓ All packages installed"
echo ""

# ── Start PostgreSQL ────────────────────────────────────────────
echo "🐘 Starting PostgreSQL..."
docker-compose -f docker/docker-compose.yml up -d postgres

echo "  ⏳ Waiting for PostgreSQL to be ready..."
until docker exec kavach_postgres pg_isready -U kavach &>/dev/null; do
    sleep 1
done
echo "  ✓ PostgreSQL is ready"
echo ""

# ── Create .env files if missing ───────────────────────────────
if [ ! -f "apps/web-app/env.example" ]; then
    echo "ℹ️  No .env file found for web-app — using defaults"
fi

echo "✅ KAVACH AI setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Start commands:"
echo ""
echo "  pnpm dev:web      → Web dashboard  (localhost:3000)"
echo "  pnpm dev:desktop  → Electron agent (desktop app)"
echo "  pnpm dev:backend  → Spring Boot    (localhost:8080)"
echo ""
echo "  API Docs: localhost:8080/swagger-ui.html"
echo ""
echo "  Demo credentials:"
echo "    Parent:    parent@demo.com   / demo123"
echo "    Student:   student@demo.com  / demo123"
echo "    Institute: admin@demo.com    / demo123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
