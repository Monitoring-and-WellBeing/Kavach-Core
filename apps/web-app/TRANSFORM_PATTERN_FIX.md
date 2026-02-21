# Fix for transformIgnorePatterns with pnpm

## Issue
The `transformIgnorePatterns` regex isn't matching pnpm's nested structure:
```
node_modules/.pnpm/until-async@3.0.2/node_modules/until-async/lib/index.js
```

## Current Pattern
```javascript
'node_modules/(?!(.*\\.pnpm/)?(until-async|msw|@bundled-es-modules|@mswjs|@open-draft)(@[^/]+)?(/node_modules)?/(until-async|msw|@bundled-es-modules|@mswjs|@open-draft)/)'
```

## If This Doesn't Work

Try this alternative pattern that's more permissive:

```javascript
transformIgnorePatterns: [
  // Match any path containing until-async or msw
  'node_modules/(?!.*(until-async|msw|@bundled-es-modules|@mswjs|@open-draft))',
  '^.+\\.module\\.(css|sass|scss)$',
],
```

Or use a simpler approach - just exclude the specific packages:

```javascript
transformIgnorePatterns: [
  '/node_modules/(?!(.*/)?(until-async|msw|@bundled-es-modules|@mswjs|@open-draft)/)',
  '^.+\\.module\\.(css|sass|scss)$',
],
```
