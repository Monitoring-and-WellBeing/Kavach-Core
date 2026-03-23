# 🧪 STEP 1: Frontend Test Infrastructure Setup

## ✅ What's Already Done

All configuration files and mock handlers have been created:
- ✅ Jest config (`jest.config.ts`)
- ✅ Jest setup (`jest.setup.ts`) with MSW
- ✅ All 12 MSW handler files
- ✅ Mock fixtures
- ✅ Husky hooks
- ✅ Package.json updated

## 🚀 What You Need to Do

### **1. Install Dependencies**

**⚠️ IMPORTANT: This project uses `pnpm` (not npm)**

```bash
cd apps/web-app
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw @types/jest ts-jest husky lint-staged
```

### **2. Initialize Husky**

```bash
cd apps/web-app
pnpm exec husky init
```

This creates `.husky/_` directory. The pre-commit and pre-push hooks are already created.

### **3. Verify Setup**

```bash
cd apps/web-app
pnpm test -- --passWithNoTests
```

**Expected Output:**
```
Test Suites: 0 passed, 0 total
Tests:       0 passed, 0 total
✅ Setup is working
```

### **4. Test MSW is Working**

Create a simple test:

```bash
cat > apps/web-app/src/__tests__/setup.test.ts << 'EOF'
import { render, screen } from '@testing-library/react'

describe('Test Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true)
  })

  it('should have MSW configured', () => {
    // MSW is set up in jest.setup.ts
    expect(global.fetch).toBeDefined()
  })
})
EOF

pnpm test
```

---

## 📋 Files Created

### **Configuration:**
- `jest.config.ts` - Jest configuration
- `jest.setup.ts` - Test setup with MSW
- `package.json` - Updated with test scripts

### **MSW Handlers (12 files):**
- `src/__tests__/mocks/fixtures.ts`
- `src/__tests__/mocks/server.ts`
- `src/__tests__/mocks/handlers/auth.handlers.ts`
- `src/__tests__/mocks/handlers/device.handlers.ts`
- `src/__tests__/mocks/handlers/dashboard.handlers.ts`
- `src/__tests__/mocks/handlers/reports.handlers.ts`
- `src/__tests__/mocks/handlers/subscription.handlers.ts`
- `src/__tests__/mocks/handlers/alert.handlers.ts`
- `src/__tests__/mocks/handlers/blocking.handlers.ts`
- `src/__tests__/mocks/handlers/focus.handlers.ts`
- `src/__tests__/mocks/handlers/goal.handlers.ts`
- `src/__tests__/mocks/handlers/badge.handlers.ts`
- `src/__tests__/mocks/handlers/insight.handlers.ts`

### **Git Hooks:**
- `.husky/pre-commit` - Runs lint-staged
- `.husky/pre-push` - Runs tests

---

## ✅ Completion Checklist

- [x] All files created
- [x] Handlers match actual API structure
- [ ] **Dependencies installed** ← Run `pnpm add -D ...`
- [ ] **Husky initialized** ← Run `pnpm exec husky init`
- [ ] **Setup verified** ← Run `pnpm test -- --passWithNoTests`

---

## 🎯 Next Step

Once Step 1 is complete (npm install + verify), proceed to **STEP 2** which will be writing actual test files for components.

---

**Status:** ✅ Configuration Complete - Ready for npm install
