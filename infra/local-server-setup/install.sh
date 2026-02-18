#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# KAVACH AI — On-Premise Local Server Setup
# For B2B institute deployments (schools, coaching centers)
# ═══════════════════════════════════════════════════════════════

set -e

KAVACH_DIR="/opt/kavach"
KAVACH_USER="kavach"

echo "🛡️  KAVACH AI — Local Server Installation"
echo "=========================================="

# Check root
if [[ $EUID -ne 0 ]]; then
    echo "❌ This script must be run as root (sudo)"
    exit 1
fi

# Check Ubuntu/Debian
if ! command -v apt-get &>/dev/null; then
    echo "❌ This installer supports Ubuntu/Debian only"
    exit 1
fi

echo "📦 Updating package list..."
apt-get update -qq

echo "📦 Installing dependencies..."
apt-get install -y -qq \
    curl \
    docker.io \
    docker-compose \
    nginx \
    ufw \
    openssl

echo "👤 Creating kavach system user..."
id -u $KAVACH_USER &>/dev/null || useradd -r -s /bin/false $KAVACH_USER
usermod -aG docker $KAVACH_USER

echo "📁 Creating KAVACH directory..."
mkdir -p $KAVACH_DIR/{config,logs,data}
chown -R $KAVACH_USER:$KAVACH_USER $KAVACH_DIR

echo "🔥 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp
ufw allow 5432/tcp
ufw --force enable

echo "🐳 Starting Docker services..."
cp docker-compose.yml $KAVACH_DIR/
cd $KAVACH_DIR
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ KAVACH AI local server is running!"
echo ""
echo "  Dashboard: http://$(hostname -I | awk '{print $1}'):3000"
echo "  API:       http://$(hostname -I | awk '{print $1}'):8080"
echo "  Swagger:   http://$(hostname -I | awk '{print $1}'):8080/swagger-ui.html"
echo ""
echo "  Default admin: admin@demo.com / demo123"
echo ""
echo "⚠️  Change default credentials immediately!"
