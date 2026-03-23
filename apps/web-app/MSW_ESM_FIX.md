# Fix for MSW v2 ESM Module Error

## Issue
MSW v2 uses ESM modules (`until-async`) that Jest can't parse:
```
SyntaxError: Unexpected token 'export'
/until-async/lib/index.js:23
export { until };
```

## Solution Applied

1. **Updated `transformIgnorePatterns`** to allow transforming MSW and its ESM dependencies:
   ```javascript
   transformIgnorePatterns: [
     'node_modules/(?!(msw|@bundled-es-modules|@mswjs|until-async|@open-draft|@mswjs|@open-draft)/)',
     '^.+\\.module\\.(css|sass|scss)$',
   ],
   ```

2. **Added JS/MJS transform** to handle ESM modules:
   ```javascript
   '^.+\\.(js|mjs)$': ['ts-jest', {
     tsconfig: {
       allowJs: true,
       esModuleInterop: true,
     },
   }],
   ```

## If This Doesn't Work

If tests still fail, try installing `babel-jest` and using Babel to transform ESM:

```bash
cd apps/web-app
pnpm add -D babel-jest @babel/preset-env --no-workspace-root
```

Then update `jest.config.js`:
```javascript
transform: {
  '^.+\\.(ts|tsx)$': ['ts-jest', { ... }],
  '^.+\\.(js|mjs)$': ['babel-jest', {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  }],
},
```
