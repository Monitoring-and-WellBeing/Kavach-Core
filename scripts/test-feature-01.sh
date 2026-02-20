#!/bin/bash
# KAVACH AI — Feature 01 Smoke Tests
# Run this after starting backend (./mvnw spring-boot:run) and ensuring PostgreSQL is up

set -e

API_URL="http://localhost:8080/api/v1"

echo "🧪 Testing Feature 01 — Auth System"
echo "===================================="
echo ""

# Test 1: Admin login
echo "Test 1: Admin login..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123"}')

ROLE=$(echo "$RESPONSE" | jq -r '.user.role // "ERROR"')
NAME=$(echo "$RESPONSE" | jq -r '.user.name // "ERROR"')

if [ "$ROLE" = "INSTITUTE_ADMIN" ] && [ "$NAME" = "Dr. Vikram Nair" ]; then
  echo "✅ PASS: Admin login works"
else
  echo "❌ FAIL: Expected INSTITUTE_ADMIN / Dr. Vikram Nair, got $ROLE / $NAME"
  exit 1
fi

# Test 2: Parent login
echo "Test 2: Parent login..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@demo.com","password":"demo123"}')

ROLE=$(echo "$RESPONSE" | jq -r '.user.role // "ERROR"')

if [ "$ROLE" = "PARENT" ]; then
  echo "✅ PASS: Parent login works"
else
  echo "❌ FAIL: Expected PARENT, got $ROLE"
  exit 1
fi

# Test 3: Student login
echo "Test 3: Student login..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com","password":"demo123"}')

ROLE=$(echo "$RESPONSE" | jq -r '.user.role // "ERROR"')

if [ "$ROLE" = "STUDENT" ]; then
  echo "✅ PASS: Student login works"
else
  echo "❌ FAIL: Expected STUDENT, got $ROLE"
  exit 1
fi

# Test 4: Wrong password
echo "Test 4: Wrong password rejection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"wrong"}')

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Wrong password correctly rejected (401)"
else
  echo "❌ FAIL: Expected 401, got $HTTP_CODE"
  exit 1
fi

# Test 5: /me with valid token
echo "Test 5: /me endpoint with token..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"demo123"}' | jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ FAIL: Could not get access token"
  exit 1
fi

RESPONSE=$(curl -s "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

NAME=$(echo "$RESPONSE" | jq -r '.name // "ERROR"')
ROLE=$(echo "$RESPONSE" | jq -r '.role // "ERROR"')

if [ "$NAME" = "Dr. Vikram Nair" ] && [ "$ROLE" = "INSTITUTE_ADMIN" ]; then
  echo "✅ PASS: /me endpoint works with token"
else
  echo "❌ FAIL: Expected Dr. Vikram Nair / INSTITUTE_ADMIN, got $NAME / $ROLE"
  exit 1
fi

# Test 6: Protected route without token
echo "Test 6: Protected route without token..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me")

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "✅ PASS: Protected route correctly requires auth ($HTTP_CODE)"
else
  echo "❌ FAIL: Expected 403/401, got $HTTP_CODE"
  exit 1
fi

echo ""
echo "===================================="
echo "✅ FEATURE 01 BACKEND OK — All 6 tests passed!"
echo ""
echo "Next: Test frontend at http://localhost:3000"
echo "  - Login page loads"
echo "  - Demo buttons work"
echo "  - Wrong password shows error"
echo "  - Session persists on refresh"
