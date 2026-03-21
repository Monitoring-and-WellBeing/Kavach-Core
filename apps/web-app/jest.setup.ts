import '@testing-library/jest-dom'

// Mock window.location to prevent jsdom navigation errors from axios interceptor
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '/',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
})

// Polyfill TextEncoder/TextDecoder for MSW in Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder as any
}

// Polyfill BroadcastChannel for MSW in Node.js environment
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(public name: string) {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true }
  } as any
}

// Polyfill WritableStream for MSW v2 in Node.js environment
if (typeof WritableStream === 'undefined') {
  // Minimal polyfill for WritableStream
  global.WritableStream = class WritableStream {
    locked: boolean = false
    constructor(underlyingSink?: any) {
      this._underlyingSink = underlyingSink
    }
    _underlyingSink?: any
    abort(reason?: any) {
      return Promise.resolve()
    }
    close() {
      return Promise.resolve()
    }
    getWriter() {
      return {
        write: (chunk?: any) => Promise.resolve(),
        close: () => Promise.resolve(),
        abort: (reason?: any) => Promise.resolve(),
        releaseLock: () => {},
        ready: Promise.resolve(),
        closed: Promise.resolve(),
        desiredSize: null,
      }
    }
  } as any
}

// Polyfill Response for MSW in Node.js environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(public body: any, public init?: any) {}
    static json(data: any, init?: any) {
      return new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
    }
  } as any
}

// Suppress console.error for expected test errors
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress React warnings and jsdom navigation errors
    if (typeof args[0] === 'string') {
      if (args[0].includes('Warning:')) return
      if (args[0].includes('Not implemented: navigation')) return
      if (args[0].includes('Error: Not implemented: navigation')) return
    }
    originalError.call(console, ...args)
  }
})
afterAll(() => { console.error = originalError })

// MSW server setup - lazy load to avoid module resolution issues during config parsing
let server: any
beforeAll(async () => {
  try {
    const { server: mswServer } = await import('./src/__tests__/mocks/server')
    server = mswServer
    server.listen({ onUnhandledRequest: 'warn' })
  } catch (error) {
    console.warn('MSW server could not be loaded:', error)
  }
})
afterEach(() => {
  if (server) server.resetHandlers()
})
afterAll(() => {
  if (server) server.close()
})
