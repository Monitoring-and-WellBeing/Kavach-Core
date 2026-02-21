# 🔧 Final Fix for Jest Setup

## Issues Found

1. **Version Mismatch:** `@jest/test-sequencer@30.2.0` installed but Jest is `29.7.0`
2. **MSW Module Resolution:** Jest can't find `msw/node` during config parsing

## Solution

### **Step 1: Fix Jest Version Mismatch**

```bash
cd apps/web-app

# Remove the wrong version
pnpm remove @jest/test-sequencer

# Install the correct version matching Jest 29.7.0
pnpm add -D @jest/test-sequencer@29.7.0
```

### **Step 2: Fix MSW Module Resolution**

The `jest.setup.ts` has been updated to lazy-load MSW, but we also need to ensure Jest can resolve modules from the workspace root.

**Update `jest.config.js`** - Add moduleDirectories:

```javascript
moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../../node_modules'],
```

### **Step 3: Verify**

```bash
cd apps/web-app
pnpm test -- --passWithNoTests
```

**Expected Output:**
```
Test Suites: 0 passed, 0 total
Tests:       0 passed, 0 total
✅ Setup is working!
```

---

## Alternative: Upgrade Jest to v30

If you prefer to use Jest 30 (which matches the installed `@jest/test-sequencer`):

```bash
cd apps/web-app
pnpm add -D jest@30.2.0 jest-environment-jsdom@30.2.0 @types/jest@30.0.0 ts-jest@30.0.0
```

Then update `jest.config.js` to use Jest 30 syntax if needed.

---

## Current Status

✅ All test infrastructure files created
✅ MSW handlers created (lazy-loaded in jest.setup.ts)
✅ Jest config created
⚠️ **Blocked by:** Version mismatch + module resolution

---

**After fixing, STEP 1 will be 100% complete!**
