// Helper to lazy-load MSW server to avoid module resolution issues during Jest config parsing
// This file is imported by test files, but the actual server import is deferred
let _server: any = null

const getServer = () => {
  if (!_server) {
    // Dynamic import at runtime, not during module resolution
    const serverModule = require('./server')
    _server = serverModule.server
  }
  return _server
}

// Export server proxy that lazy-loads the actual server
export const server = {
  use: (...handlers: any[]) => {
    return getServer().use(...handlers)
  },
  resetHandlers: () => {
    return getServer().resetHandlers()
  },
  close: () => {
    return getServer().close()
  },
  listen: (options?: any) => {
    return getServer().listen(options)
  },
}
