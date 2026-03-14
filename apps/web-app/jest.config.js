// Jest config - standalone to avoid next.config.js loading issues
const path = require('path')

// Workaround for pnpm workspace: ensure @jest/test-sequencer can be resolved
// Jest tries to resolve this during config parsing, before moduleDirectories applies
const rootNodeModules = path.join(__dirname, '../../node_modules')
const localNodeModules = path.join(__dirname, 'node_modules')

// Try to resolve from multiple locations
let testSequencerPath = null
const searchPaths = [
  path.join(localNodeModules, '@jest/test-sequencer'),
  path.join(rootNodeModules, '@jest/test-sequencer'),
]

for (const testPath of searchPaths) {
  try {
    require.resolve(testPath)
    testSequencerPath = testPath
    break
  } catch (e) {
    // Continue searching
  }
}

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock Next.js modules
    '^next/navigation$': '<rootDir>/src/__tests__/mocks/next-navigation.mock.ts',
    '^next/image$': '<rootDir>/src/__tests__/mocks/next-image.mock.ts',
  },
  // Resolve modules from workspace root for pnpm
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>/../../node_modules'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        paths: {
          '@/*': ['<rootDir>/src/*'],
        },
      },
    }],
    // Transform JS/MJS files from MSW and its ESM dependencies using babel-jest
    '^.+\\.(js|mjs)$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.tsx',
    '!src/**/layout.tsx',
    '!src/**/loading.tsx',
    '!src/**/not-found.tsx',
    '!src/app/**/page.tsx',
  ],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  coverageThreshold: {
    global: {
      lines: 30,
      functions: 30,
      branches: 20,
    },
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/src/__tests__/mocks/'],
  transformIgnorePatterns: [
    // Allow transforming MSW and its ESM dependencies
    // Don't ignore paths containing these packages (works with pnpm nested structure)
    // Pattern: ignore everything in node_modules EXCEPT paths containing these package names
    'node_modules/(?!.*(until-async|msw|@bundled-es-modules|@mswjs|@open-draft))',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
}
