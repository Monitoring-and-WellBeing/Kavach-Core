# 🔧 Test Fix Needed

## Issue: `@jest/test-sequencer` Not Found

Jest can't find `@jest/test-sequencer` during config parsing. This is a pnpm workspace resolution issue.

## ✅ Fix: Reinstall at Root

Run this command from the **root directory**:

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm add -D -w @jest/test-sequencer@29.7.0
```

The `-w` flag installs it at the workspace root, making it available to all packages.

## ✅ Then Run Tests

After fixing, run:

```bash
cd apps/web-app

# Run all tests
pnpm test

# Run specific feature
pnpm test:auth
pnpm test:devices
pnpm test:reports
pnpm test:alerts
pnpm test:blocking
pnpm test:focus
pnpm test:goals

# Run all feature tests
pnpm test:features

# With coverage
pnpm test:coverage
```

---

## ✅ What's Already Fixed

1. ✅ All test files updated to use `test-helpers` instead of direct `server` import
2. ✅ Test helper created to lazy-load MSW server
3. ✅ All 8 feature test files created
4. ✅ Package.json scripts added

---

## Expected Result

After fixing `@jest/test-sequencer`, tests should run and you'll see:
- Test results (pass/fail)
- Coverage reports (if using `test:coverage`)
- Any API mismatches that need fixing

---

**Status:** ⚠️ **Blocked by @jest/test-sequencer - Needs reinstall at root**
