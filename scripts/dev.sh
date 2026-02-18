#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KAVACH AI — Start All Dev Services
# ═══════════════════════════════════════════════════════════════

set -e

echo "🛡️  Starting KAVACH AI development environment..."
echo ""

# Start DB if not running
if ! docker ps | grep -q kavach_postgres; then
    echo "🐘 Starting PostgreSQL..."
    docker-compose -f docker/docker-compose.yml up -d postgres
    sleep 3
fi

# Start web app in background
echo "🌐 Starting web dashboard (port 3000)..."
pnpm --filter web-app dev &
WEB_PID=$!

# Start backend in background
echo "⚙️  Starting Spring Boot backend (port 8080)..."
(cd backend && ./mvnw spring-boot:run -q) &
BACKEND_PID=$!

echo ""
echo "✅ All services started!"
echo "  Web:     http://localhost:3000"
echo "  API:     http://localhost:8080"
echo "  Swagger: http://localhost:8080/swagger-ui.html"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and cleanup on exit
trap 'echo ""; echo "Stopping services..."; kill $WEB_PID $BACKEND_PID 2>/dev/null; exit 0' INT TERM

wait
