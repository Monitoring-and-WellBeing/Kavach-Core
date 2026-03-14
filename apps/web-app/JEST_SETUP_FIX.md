# 🔧 Jest Setup Fix - Missing Dependencies

## Issue

Jest is failing because:
1. Missing Babel plugin: `@babel/plugin-bugfix-firefox-class-in-computed-class-key`
2. Missing Jest module: `@jest/test-sequencer`
3. pnpm store location mismatch

## Solution

### **Option 1: Fix pnpm store and install missing dependencies (Recommended)**

```bash
# From root directory
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core

# Fix pnpm store issue
pnpm install

# Install missing Babel plugin
pnpm add -D @babel/plugin-bugfix-firefox-class-in-computed-class-key --filter web-app

# Verify Jest works
cd apps/web-app
pnpm test -- --passWithNoTests
```

### **Option 2: Use nextJest with environment variable workaround**

The current `jest.config.js` is standalone. If you prefer using `nextJest`, we need to ensure next.config.js doesn't load during Jest initialization.

**Temporary workaround:** Rename `next.config.js` before running tests:

```bash
# Before tests
mv apps/web-app/next.config.js apps/web-app/next.config.js.bak

# Run tests
cd apps/web-app && pnpm test

# Restore config
mv apps/web-app/next.config.js.bak apps/web-app/next.config.js
```

### **Option 3: Install all Jest dependencies explicitly**

```bash
cd apps/web-app
pnpm add -D @jest/test-sequencer @babel/plugin-bugfix-firefox-class-in-computed-class-key
```

---

## Current Status

✅ All test infrastructure files created:
- Jest config (`jest.config.js`)
- Jest setup (`jest.setup.ts`)
- All MSW handlers (12 files)
- Mock fixtures
- Git hooks

⚠️ **Blocked by:** Missing dependencies due to pnpm store issue

---

## Quick Fix Command

Run this from the **root directory**:

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install
cd apps/web-app
pnpm add -D @babel/plugin-bugfix-firefox-class-in-computed-class-key @jest/test-sequencer
pnpm test -- --passWithNoTests
```

---

**Once this works, you'll see:**
```
Test Suites: 0 passed, 0 total
Tests:       0 passed, 0 total
✅ Setup is working!
```
