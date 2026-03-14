# Final Fix for MSW v2 ESM Error

## Current Error
```
SyntaxError: Unexpected token 'export'
node_modules/.pnpm/until-async@3.0.2/node_modules/until-async/lib/index.js:23
export { until };
```

## What's Been Done

1. ✅ Installed `babel-jest` and `@babel/preset-env`
2. ✅ Updated Jest transform to use `babel-jest` for JS/MJS files
3. ✅ Created `babel.config.js` for Babel configuration
4. ✅ Updated `transformIgnorePatterns` to allow transforming MSW dependencies

## Current Pattern

```javascript
transformIgnorePatterns: [
  '/node_modules/(?!.*/(until-async|msw|@bundled-es-modules|@mswjs|@open-draft))',
  '^.+\\.module\\.(css|sass|scss)$',
],
```

## If Tests Still Fail

The pattern might need adjustment. Try this more permissive pattern:

```javascript
transformIgnorePatterns: [
  // Don't ignore any path containing these package names
  'node_modules/(?!.*(until-async|msw|@bundled-es-modules|@mswjs|@open-draft))',
  '^.+\\.module\\.(css|sass|scss)$',
],
```

Or test if the pattern is working by checking what Jest sees:

```bash
cd apps/web-app
NODE_OPTIONS='--trace-warnings' pnpm test 2>&1 | grep -i "until-async" | head -5
```

## Alternative: Use MSW v1

If MSW v2 continues to cause issues, downgrade to v1:

```bash
cd apps/web-app
pnpm remove msw
pnpm add -D msw@^1.3.2 --no-workspace-root
```

Then update all imports from `msw` to `msw/node` for handlers.
