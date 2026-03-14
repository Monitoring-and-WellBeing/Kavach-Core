// Expose Expo's public env variables to TypeScript via the process.env shim
// that Expo's Metro bundler (and Babel plugin) injects at build time.
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string
    NODE_ENV: 'development' | 'test' | 'production'
    [key: string]: string | undefined
  }
}
