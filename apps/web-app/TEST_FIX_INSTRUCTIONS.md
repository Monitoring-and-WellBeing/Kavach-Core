# Test Commands - Fix Required

## 🔴 Issue: `@jest/test-sequencer` Module Resolution

All test commands are failing with:
```
Error: Cannot find module '@jest/test-sequencer'
```

## ✅ Solution

The package is listed in `package.json` but needs to be properly installed/linked in the pnpm workspace.

### **Run this command from the repository root:**

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
pnpm install
```

This will:
1. Install `@jest/test-sequencer@29.7.0` at the root (already in root `package.json`)
2. Link it properly to `apps/web-app` (already in `apps/web-app/package.json`)
3. Ensure all workspace dependencies are correctly resolved

### **After running `pnpm install`, test commands should work:**

```bash
cd apps/web-app

# All tests
pnpm test

# Individual feature tests
pnpm test:auth
pnpm test:devices
pnpm test:reports
pnpm test:alerts
pnpm test:blocking
pnpm test:focus
pnpm test:goals

# All feature tests
pnpm test:features

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# CI mode
pnpm test:ci
```

## 📋 Why This Happens

1. **pnpm workspaces** require dependencies to be installed at the root level
2. **Jest** tries to resolve `@jest/test-sequencer` during config parsing (before `moduleDirectories` applies)
3. **Module resolution** in pnpm workspaces needs proper linking via `pnpm install`

## ✅ Status

- ✅ All test files created
- ✅ Jest configuration complete
- ✅ MSW handlers set up
- ✅ All test scripts configured
- ⚠️ **Pending:** Run `pnpm install` from root to link `@jest/test-sequencer`

## 🎯 Next Steps

1. Run `pnpm install` from repository root
2. Run `pnpm test` from `apps/web-app` to verify
3. All test commands should now work!
