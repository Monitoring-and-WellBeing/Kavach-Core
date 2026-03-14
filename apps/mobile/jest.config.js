/** @type {import('jest').Config} */

// Packages that must be Babel-transformed (ship raw JSX/TS/Flow source)
const ALLOW = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?',
  '@expo-google-fonts',
  'react-navigation',
  '@react-navigation',
  '@unimodules',
  'unimodules',
  'sentry-expo',
  'native-base',
  'react-native-svg',
  'victory-native',
  '@shopify',
].join('|')

module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  transformIgnorePatterns: [
    // Pattern 1: flat node_modules — ignore everything EXCEPT allowed packages AND .pnpm
    // (.pnpm handled separately in pattern 2)
    `node_modules/(?!(\\.pnpm|${ALLOW}))`,

    // Pattern 2: pnpm virtual store — ignore packages inside .pnpm that are NOT
    // in the allow list.  pnpm paths: .pnpm/PKG@VER.../node_modules/PKG/file
    // Negative lookahead: "do NOT ignore if the path starts with ALLOW then @/+ version"
    `node_modules/\\.pnpm/(?!(${ALLOW})[^/]*/node_modules)`,
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],

  coverageReporters: ['text', 'lcov', 'html'],
}
