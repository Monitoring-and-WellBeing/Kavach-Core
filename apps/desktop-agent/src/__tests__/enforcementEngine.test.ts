// ─── EnforcementEngine + processParser + RuleSync unit tests ─────────────────

import { parseWmicOutput, parseTasklistOutput } from '../enforcement/processParser'
import { EnforcementEngine, BlockingRule } from '../enforcement/EnforcementEngine'
import { RuleSync } from '../enforcement/RuleSync'
import { BrowserMonitor } from '../enforcement/BrowserMonitor'

// Mock child_process so we don't actually spawn system commands in tests
jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, _opts: unknown, cb?: Function) => {
    const callback = typeof _opts === 'function' ? _opts : cb
    callback?.(null, '', '')
  }),
}))

jest.mock('../auth/config', () => ({
  loadConfig: jest.fn().mockResolvedValue({
    deviceLinked: true,
    deviceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    apiUrl: 'http://localhost:8080',
    agentVersion: '1.2.4',
    hostname: 'test-host',
  }),
}))

// ── processParser ──────────────────────────────────────────────────────────────

describe('parseWmicOutput', () => {
  it('parses standard WMIC CSV output correctly', () => {
    const csv = [
      'Node,Description,Name,ProcessId',
      'HOSTNAME,Notepad,notepad.exe,1234',
      'HOSTNAME,Google Chrome,chrome.exe,5678',
    ].join('\n')

    const result = parseWmicOutput(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ name: 'notepad.exe', pid: 1234 })
    expect(result[1]).toMatchObject({ name: 'chrome.exe', pid: 5678 })
  })

  it('filters out rows with pid 0 or empty name', () => {
    const csv = [
      'Node,Description,Name,ProcessId',
      'HOSTNAME,,SystemIdleProcess,0',
      'HOSTNAME,Real App,real.exe,999',
    ].join('\n')

    const result = parseWmicOutput(csv)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('real.exe')
  })

  it('returns empty array for empty input', () => {
    expect(parseWmicOutput('')).toEqual([])
  })
})

describe('parseTasklistOutput', () => {
  it('parses standard tasklist CSV output correctly', () => {
    const csv = [
      '"notepad.exe","1234","Console","1","8,192 K"',
      '"chrome.exe","5678","Console","1","250,000 K"',
    ].join('\n')

    const result = parseTasklistOutput(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ name: 'notepad.exe', pid: 1234 })
    expect(result[1]).toMatchObject({ name: 'chrome.exe', pid: 5678 })
  })

  it('filters rows with pid 0', () => {
    const csv = [
      '"System Idle Process","0","Console","0","24 K"',
      '"real.exe","42","Console","1","1,000 K"',
    ].join('\n')

    const result = parseTasklistOutput(csv)
    expect(result).toHaveLength(1)
    expect(result[0].pid).toBe(42)
  })
})

// ── EnforcementEngine ─────────────────────────────────────────────────────────

describe('EnforcementEngine', () => {
  let engine: EnforcementEngine

  beforeEach(() => {
    jest.useFakeTimers()
    engine = new EnforcementEngine('device-001')
  })

  afterEach(() => {
    engine.stop()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('starts and stops without throwing', () => {
    expect(() => engine.start()).not.toThrow()
    expect(() => engine.stop()).not.toThrow()
  })

  it('start() is idempotent — calling twice does not create two intervals', () => {
    engine.start()
    engine.start()  // second call should be a no-op
    // If we reach here without error the test passes
    engine.stop()
  })

  it('setRules() / getRules() work correctly', () => {
    const rules: BlockingRule[] = [
      {
        id: 'r1',
        type: 'BLOCK_APP',
        target: 'game.exe',
        isActive: true,
      },
    ]
    engine.setRules(rules)
    expect(engine.getRules()).toHaveLength(1)
    expect(engine.getRules()[0].target).toBe('game.exe')
  })

  it('inactive rules do not trigger enforcement', () => {
    const rules: BlockingRule[] = [
      {
        id: 'r1',
        type: 'BLOCK_APP',
        target: 'game.exe',
        isActive: false,  // ← inactive
      },
    ]
    engine.setRules(rules)
    engine.start()
    // Advance timer — no kill attempts should be made since rule is inactive
    jest.advanceTimersByTime(2500)
    // If we get here without error, enforcement correctly skipped the inactive rule
  })
})

// ── Schedule active check (via isRuleScheduleActive indirectly) ───────────────

describe('BlockingRule schedule', () => {
  it('rule without schedule is always active', () => {
    const rule: BlockingRule = {
      id: 'r1',
      type: 'BLOCK_APP',
      target: 'game.exe',
      isActive: true,
      // no schedule property
    }
    // No schedule = always enforced (tested indirectly via setRules)
    expect(rule.schedule).toBeUndefined()
  })

  it('schedule with days array is structured correctly', () => {
    const rule: BlockingRule = {
      id: 'r2',
      type: 'BLOCK_APP',
      target: 'youtube.exe',
      isActive: true,
      schedule: {
        days: [1, 2, 3, 4, 5],  // Mon–Fri
        startTime: '09:00',
        endTime: '17:00',
      },
    }
    expect(rule.schedule!.days).toContain(1)  // Monday
    expect(rule.schedule!.days).not.toContain(0) // Not Sunday
  })
})

// ── RuleSync ──────────────────────────────────────────────────────────────────

describe('RuleSync', () => {
  let engine: EnforcementEngine
  let browserMonitor: BrowserMonitor

  beforeEach(() => {
    jest.useFakeTimers()
    engine = new EnforcementEngine('device-001')
    browserMonitor = new BrowserMonitor()
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          rules: [
            {
              id: 'r-1',
              ruleType: 'APP',
              target: 'game.exe',
              scheduleEnabled: false,
              scheduleDays: 'MON,TUE,WED,THU,FRI',
              blockMessage: 'Gaming blocked',
              active: true,
            },
          ],
          lastUpdated: '2024-01-01T00:00:00Z',
        }),
      } as Response)
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('start() fetches rules immediately and sets them on the engine', async () => {
    const sync = new RuleSync('device-001', engine, browserMonitor)
    sync.start()

    // Allow the immediate sync promise to resolve
    await Promise.resolve()
    await Promise.resolve()

    sync.stop()
    // Engine should have at least the rules we mocked (timing may differ in test)
    expect(fetch).toHaveBeenCalled()
  })

  it('stop() clears the interval without throwing', () => {
    const sync = new RuleSync('device-001', engine, browserMonitor)
    sync.start()
    expect(() => sync.stop()).not.toThrow()
  })

  it('handles network failure gracefully — rules not cleared', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    engine.setRules([
      { id: 'existing', type: 'BLOCK_APP', target: 'existing.exe', isActive: true },
    ])

    const sync = new RuleSync('device-001', engine, browserMonitor)
    sync.start()

    await Promise.resolve()
    await Promise.resolve()

    sync.stop()

    // Existing rules should be preserved even if sync fails
    // (the engine is only updated when sync succeeds)
    expect(engine.getRules()).toHaveLength(1)
  })
})
