# Fix for `@jest/test-sequencer` Error in pnpm Workspace

## 🔴 Problem

Jest fails with: `Error: Cannot find module '@jest/test-sequencer'`

This happens because Jest tries to resolve `@jest/test-sequencer` during config parsing, before `moduleDirectories` or `NODE_PATH` can help.

## ✅ Solution Options

### **Option 1: Install Directly in web-app (Recommended)**

Run this from the repository root:

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core
cd apps/web-app
pnpm add -D @jest/test-sequencer@29.7.0 --no-workspace-root
```

This installs it directly in `apps/web-app/node_modules`, making it immediately available to Jest.

### **Option 2: Use pnpm shamefully-hoist**

Add to root `.npmrc` or `pnpm-workspace.yaml`:

```yaml
# .npmrc
shamefully-hoist=true
```

Then run:
```bash
pnpm install
```

### **Option 3: Create Symlink (Workaround)**

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core/apps/web-app
mkdir -p node_modules/@jest
ln -s ../../../node_modules/.pnpm/@jest+test-sequencer@29.7.0/node_modules/@jest/test-sequencer node_modules/@jest/test-sequencer
```

### **Option 4: Use Jest Preset (Alternative)**

Switch to using `nextJest` which handles module resolution better:

```bash
cd apps/web-app
pnpm add -D jest-config
```

Then update `jest.config.js` to use `nextJest`.

## 🎯 Quick Fix (Try This First)

```bash
cd /Users/mishra/Desktop/WE/Mono\ repo/Kavach-Core/apps/web-app
pnpm add -D @jest/test-sequencer@29.7.0 --no-workspace-root
pnpm test
```

## 📋 Current Status

- ✅ All test files created
- ✅ Jest configuration complete  
- ✅ MSW handlers set up
- ✅ Test scripts configured with NODE_PATH
- ⚠️ **Blocked by:** `@jest/test-sequencer` module resolution

## 🔍 Why This Happens

1. **pnpm workspaces** use symlinks to a central store
2. **Jest's normalize.js** uses `require.resolve()` which doesn't follow pnpm symlinks
3. **Config parsing** happens before `moduleDirectories` or `NODE_PATH` can help
4. **Solution:** Install package where Jest expects it (directly in web-app/node_modules)
