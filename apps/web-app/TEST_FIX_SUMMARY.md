# Test Setup - Current Status & Next Steps

## ✅ Fixed Issues

1. **@jest/test-sequencer** - Installed locally in `apps/web-app/node_modules`
2. **WritableStream** - Polyfill added to `jest.setup.ts`
3. **BroadcastChannel** - Polyfill already present
4. **TextEncoder/TextDecoder** - Polyfills already present
5. **Response** - Polyfill already present

## 🔴 Current Issue: MSW v2 ESM Modules

**Error:**
```
SyntaxError: Unexpected token 'export'
/until-async/lib/index.js:23
export { until };
```

**Root Cause:** MSW v2 uses ESM modules that Jest can't parse by default.

## ✅ Config Updates Applied

1. **transformIgnorePatterns** - Updated to allow transforming MSW dependencies
2. **Transform for JS/MJS** - Added to handle ESM modules
3. **moduleFileExtensions** - Added 'mjs' support

## 🎯 Next Step: Install babel-jest

Since `ts-jest` might not properly transform pure ESM modules, install Babel:

```bash
cd apps/web-app
pnpm add -D babel-jest @babel/preset-env --no-workspace-root
```

Then update `jest.config.js` transform section:

```javascript
transform: {
  '^.+\\.(ts|tsx)$': ['ts-jest', {
    tsconfig: {
      jsx: 'react-jsx',
      paths: {
        '@/*': ['<rootDir>/src/*'],
      },
    },
  }],
  '^.+\\.(js|mjs)$': ['babel-jest', {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  }],
},
```

## 🧪 After Installing babel-jest

Run tests again:
```bash
pnpm test
```

Tests should now work! 🎉
