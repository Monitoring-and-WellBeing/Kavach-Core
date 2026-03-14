# 🧪 Test Status & Commands

## ⚠️ Current Blocker

**Issue:** `@jest/test-sequencer` is in `package.json` but not installed/linked properly in pnpm workspace.

**Error:** `Cannot find module '@jest/test-sequencer'` during Jest config parsing.

---

## ✅ Fix Required (Run This First)

```bash
# From root directory - this will install all workspace dependencies
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install

# Then run tests
cd apps/web-app
pnpm test
```

---

## 🚀 Test Commands (After Fix)

Once `pnpm install` completes, run these commands:

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

## ✅ What's Already Fixed

1. ✅ **TextEncoder polyfill** added to `jest.setup.ts`
2. ✅ **All test files** updated to use `test-helpers` (fixes MSW import)
3. ✅ **All 8 feature test files** created
4. ✅ **Package.json scripts** configured
5. ✅ **@jest/test-sequencer** listed in package.json

---

## 📊 Expected Results

After `pnpm install`, you should see:

### **Success:**
```
PASS  src/__tests__/features/01-auth.test.tsx
PASS  src/__tests__/features/02-devices.test.tsx
...

Test Suites: 8 passed, 8 total
Tests:       45+ passed
```

### **With Coverage:**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
All files |    30+  |    20+   |    30+  |    30+
```

---

## 🐛 If Tests Fail

Common issues and fixes:

1. **API method name mismatch** - Update test to match your actual API (e.g., `list()` vs `getAll()`)
2. **Response structure mismatch** - Update test expectations to match your API responses
3. **Import path issues** - Verify `@/` alias resolves correctly

---

**Status:** ⚠️ **Blocked by pnpm install - Run `pnpm install` at root first**
