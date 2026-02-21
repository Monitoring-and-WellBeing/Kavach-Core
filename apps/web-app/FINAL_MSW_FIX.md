# Final Fix for MSW v2 ESM Error

## Current Error
```
SyntaxError: Unexpected token 'export'
/until-async/lib/index.js:23
export { until };
```

## What I've Done

1. ✅ Updated `transformIgnorePatterns` to allow transforming MSW dependencies
2. ✅ Added JS/MJS transform using ts-jest
3. ✅ Added 'mjs' to `moduleFileExtensions`

## If Tests Still Fail

The issue is that `ts-jest` might not properly transform pure ESM modules. You may need to install `babel-jest`:

```bash
cd apps/web-app
pnpm add -D babel-jest @babel/preset-env --no-workspace-root
```

Then update the transform in `jest.config.js`:

```javascript
transform: {
  '^.+\\.(ts|tsx)$': ['ts-jest', { ... }],
  '^.+\\.(js|mjs)$': ['babel-jest', {
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  }],
},
```

## Alternative: Use MSW v1

If MSW v2 continues to cause issues, you could downgrade to MSW v1:

```bash
cd apps/web-app
pnpm add -D msw@^1.3.2 --no-workspace-root
```

Then update imports from `msw` to `msw/node` for handlers.
