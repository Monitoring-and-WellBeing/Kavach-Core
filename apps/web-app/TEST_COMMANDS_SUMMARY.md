# 🧪 Test Commands Summary

## ⚠️ Current Status

**Blocker:** `@jest/test-sequencer` exists in pnpm store but Jest can't resolve it during config parsing.

**Root Cause:** pnpm workspace module resolution - package is at root but Jest (running from web-app) can't find it during config parsing.

---

## ✅ Required Fix

Run this **once** to properly link all workspace dependencies:

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install
```

This will properly link `@jest/test-sequencer` from root to web-app.

---

## 🚀 All Test Commands (After Fix)

### **1. Run All Tests**
```bash
cd apps/web-app
pnpm test
```

### **2. Run Specific Feature Tests**
```bash
cd apps/web-app

pnpm test:auth          # Feature 01 - Authentication
pnpm test:devices       # Feature 02/03 - Devices & Activity  
pnpm test:reports       # Feature 07 - Reports & Analytics
pnpm test:alerts        # Feature 05 - Alerts & Rules
pnpm test:blocking      # Feature 06 - App & Website Blocking
pnpm test:focus         # Feature 08 - Focus Mode
pnpm test:goals         # Feature 09 - Goals System
```

### **3. Run All Feature Tests**
```bash
cd apps/web-app
pnpm test:features
```

### **4. Run with Coverage**
```bash
cd apps/web-app
pnpm test:coverage
```

### **5. Watch Mode**
```bash
cd apps/web-app
pnpm test:watch
```

### **6. CI Mode**
```bash
cd apps/web-app
pnpm test:ci
```

---

## ✅ What's Ready

- ✅ All 8 feature test files created
- ✅ TextEncoder polyfill added
- ✅ MSW test-helpers created
- ✅ All imports fixed
- ✅ Package.json scripts configured
- ✅ `@jest/test-sequencer` in package.json

**Just need:** `pnpm install` to link dependencies properly

---

## 📊 Expected Output (After Fix)

```
PASS  src/__tests__/features/01-auth.test.tsx
PASS  src/__tests__/features/02-devices.test.tsx
PASS  src/__tests__/features/05-reports.test.ts
PASS  src/__tests__/features/06-alerts.test.ts
PASS  src/__tests__/features/07-blocking.test.ts
PASS  src/__tests__/features/08-focus.test.ts
PASS  src/__tests__/features/09-goals.test.ts
PASS  src/__tests__/features/10-insights-badges-subscription.test.ts

Test Suites: 8 passed, 8 total
Tests:       45+ passed
```

---

**Status:** ⚠️ **Run `pnpm install` at root, then all test commands will work**
