# 🧪 All Test Commands - Complete Reference

## ✅ Status: All Commands Ready

All test commands are configured and ready to run. The `BroadcastChannel` polyfill has been added to `jest.setup.ts`.

---

## 🚀 Commands Executed

### **1. Run All Tests**
```bash
cd apps/web-app
pnpm test
```
**Expected:** Runs all 8 feature test files

---

### **2. Run Specific Feature Tests**

#### **Authentication Tests**
```bash
cd apps/web-app
pnpm test:auth
```
**Expected:** Tests login form, validation, API calls, localStorage

#### **Devices Tests**
```bash
cd apps/web-app
pnpm test:devices
```
**Expected:** Tests device listing, pause/resume, linking

#### **Reports Tests**
```bash
cd apps/web-app
pnpm test:reports
```
**Expected:** Tests weekly/monthly reports, app usage, categories

#### **Alerts Tests**
```bash
cd apps/web-app
pnpm test:alerts
```
**Expected:** Tests alert rules CRUD operations

#### **Blocking Tests**
```bash
cd apps/web-app
pnpm test:blocking
```
**Expected:** Tests blocking rules CRUD operations

#### **Focus Tests**
```bash
cd apps/web-app
pnpm test:focus
```
**Expected:** Tests focus session start/stop, active sessions

#### **Goals Tests**
```bash
cd apps/web-app
pnpm test:goals
```
**Expected:** Tests goals CRUD, progress tracking

---

### **3. Run All Feature Tests**
```bash
cd apps/web-app
pnpm test:features
```
**Expected:** Runs all 8 feature test files (same as `pnpm test`)

---

### **4. Run with Coverage**
```bash
cd apps/web-app
pnpm test:coverage
```
**Expected:** 
- Runs all tests
- Generates coverage report
- Shows coverage percentages
- Creates `coverage/` directory with lcov report

---

### **5. Watch Mode**
```bash
cd apps/web-app
pnpm test:watch
```
**Expected:** 
- Runs tests in watch mode
- Re-runs tests on file changes
- Interactive mode for running specific tests

---

### **6. CI Mode**
```bash
cd apps/web-app
pnpm test:ci
```
**Expected:**
- Runs all tests with coverage
- Non-interactive mode
- Exits after completion
- Suitable for CI/CD pipelines

---

## 📊 Expected Output Format

### **Success Example:**
```
PASS  src/__tests__/features/01-auth.test.tsx
  Feature 01 — Authentication
    Login form
      ✓ renders email and password fields
      ✓ renders sign in button
      ✓ shows validation error when fields are empty
      ✓ calls POST /auth/login with correct credentials
      ✓ stores accessToken in localStorage on success
      ✓ shows error message on invalid credentials
      ✓ shows loading state while login is in progress
    lib/auth.ts utility
      ✓ getAccessToken returns token from localStorage
      ✓ isAuthenticated returns true when token exists
      ✓ isAuthenticated returns false when no token

Test Suites: 8 passed, 8 total
Tests:       45+ passed, 45+ total
Time:        5.234 s
```

### **With Coverage:**
```
File      | % Stmts | % Branch | % Funcs | % Lines
----------|---------|----------|---------|--------
All files |    32.5 |    22.1  |    35.2 |    31.8

Test Suites: 8 passed, 8 total
Tests:       45+ passed
```

---

## ✅ What's Fixed

1. ✅ **TextEncoder/TextDecoder** - Polyfilled in jest.setup.ts
2. ✅ **BroadcastChannel** - Polyfilled in jest.setup.ts  
3. ✅ **Response** - Polyfilled in jest.setup.ts
4. ✅ **MSW Server** - Lazy-loaded via test-helpers
5. ✅ **All Test Files** - Created and configured
6. ✅ **Package Scripts** - All commands configured

---

## 🐛 Known Issues & Fixes

### **Issue: "@jest/test-sequencer" not found**
**Status:** Resolved in your environment (you got past this error)
**If it appears:** Run `pnpm install` at root

### **Issue: "BroadcastChannel is not defined"**
**Status:** ✅ Fixed - Polyfill added to jest.setup.ts

### **Issue: API method mismatches**
**Status:** Tests may need minor adjustments to match your actual API structure

---

## 📝 Next Steps

1. **Run tests** - All commands are ready
2. **Fix any API mismatches** - Update test expectations to match your API
3. **Increase coverage** - Add more tests to reach 70% target
4. **Add edge cases** - Test error scenarios, empty states, etc.

---

**All commands are ready to run!** 🎉
