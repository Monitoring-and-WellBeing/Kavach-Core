# 🧪 Running Tests - Quick Guide

## ⚠️ Prerequisite: Ensure Dependencies Are Installed

If you see `@jest/test-sequencer` errors, run:

```bash
# From root directory
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install
```

This ensures all workspace dependencies (including `@jest/test-sequencer`) are properly linked.

---

## 🚀 Run Tests

```bash
cd apps/web-app

# Run all tests
pnpm test

# Run specific feature tests
pnpm test:auth          # Feature 01 - Authentication
pnpm test:devices       # Feature 02/03 - Devices & Activity
pnpm test:reports       # Feature 07 - Reports & Analytics
pnpm test:alerts        # Feature 05 - Alerts & Rules
pnpm test:blocking      # Feature 06 - App & Website Blocking
pnpm test:focus         # Feature 08 - Focus Mode
pnpm test:goals         # Feature 09 - Goals System

# Run all feature tests
pnpm test:features

# With coverage report
pnpm test:coverage

# Watch mode (auto-rerun on file changes)
pnpm test:watch

# CI mode (with coverage, no watch)
pnpm test:ci
```

---

## 📊 Expected Output

### **Success:**
```
PASS  src/__tests__/features/01-auth.test.tsx
PASS  src/__tests__/features/02-devices.test.tsx
...

Test Suites: 8 passed, 8 total
Tests:       45 passed, 45 total
```

### **With Coverage:**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
All files |    45.2 |    32.1 |    38.5 |    44.8
```

---

## 🐛 Common Issues

### **Issue: "Cannot find module '@jest/test-sequencer'"**
**Fix:**
```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install
```

### **Issue: "Cannot find module 'msw/node'"**
**Fix:** Already handled via `test-helpers.ts` - tests use lazy-loaded server

### **Issue: "API method not found"**
**Fix:** Check your actual API file - method names might differ (e.g., `list()` vs `getAll()`)

### **Issue: "Property does not exist"**
**Fix:** Update test to match your actual API response structure

---

## ✅ What's Ready

- ✅ All 8 feature test files created
- ✅ MSW handlers for all API endpoints
- ✅ Test helpers for lazy-loading MSW
- ✅ Package.json scripts configured
- ✅ Coverage thresholds set (30% - increase over time)

---

**Ready to test!** 🎉
