/**
 * Unit tests for src/lib/badgesApi.ts
 * Verifies API calls + display helper constants.
 */
import { badgesApi, CATEGORY_LABELS, LEVEL_COLORS, NEXT_LEVELS, BadgeProgress } from '../../lib/badgesApi'
import { api } from '../../lib/axios'

jest.mock('../../lib/axios', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}))

const mockGet = api.get as jest.MockedFunction<typeof api.get>

const MOCK_PROGRESS: BadgeProgress = {
  totalXp: 350,
  badgesEarned: 4,
  badgesTotal: 24,
  level: 'Explorer',
  levelProgress: 70,
  badges: [
    {
      id: 'b1',
      code: 'FIRST_FOCUS',
      name: 'First Focus',
      description: 'Complete your first focus session',
      icon: '🎯',
      category: 'FOCUS',
      tier: 'BRONZE',
      xpReward: 50,
      earned: true,
      earnedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'b2',
      code: 'WEEK_STREAK',
      name: '7-Day Streak',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      category: 'STREAK',
      tier: 'SILVER',
      xpReward: 100,
      earned: false,
    },
  ],
  recentlyEarned: [],
  byCategory: { FOCUS: 2, STREAK: 1, USAGE: 1, REDUCTION: 0, MILESTONE: 0, SPECIAL: 0 },
}

afterEach(() => jest.clearAllMocks())

describe('badgesApi.getProgress', () => {
  it('calls GET /badges/device/{deviceId}', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_PROGRESS } as any)
    await badgesApi.getProgress('device-abc')
    expect(mockGet).toHaveBeenCalledWith('/badges/device/device-abc')
  })

  it('returns badge progress data', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_PROGRESS } as any)
    const result = await badgesApi.getProgress('device-abc')

    expect(result.totalXp).toBe(350)
    expect(result.badgesEarned).toBe(4)
    expect(result.level).toBe('Explorer')
    expect(result.levelProgress).toBe(70)
    expect(result.badges).toHaveLength(2)
  })

  it('correctly separates earned from unearned badges', async () => {
    mockGet.mockResolvedValueOnce({ data: MOCK_PROGRESS } as any)
    const result = await badgesApi.getProgress('device-abc')

    const earned = result.badges.filter((b) => b.earned)
    const unearned = result.badges.filter((b) => !b.earned)
    expect(earned).toHaveLength(1)
    expect(unearned).toHaveLength(1)
    expect(earned[0].name).toBe('First Focus')
  })

  it('propagates API errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Unauthorized'))
    await expect(badgesApi.getProgress('device-abc')).rejects.toThrow('Unauthorized')
  })
})

describe('CATEGORY_LABELS', () => {
  it('has labels + emojis for all 6 categories', () => {
    expect(CATEGORY_LABELS.FOCUS.label).toBe('Focus')
    expect(CATEGORY_LABELS.FOCUS.emoji).toBe('🎯')
    expect(CATEGORY_LABELS.STREAK.emoji).toBe('🔥')
    expect(CATEGORY_LABELS.MILESTONE.emoji).toBe('🏆')
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6)
  })
})

describe('LEVEL_COLORS', () => {
  it('maps level names to hex colors', () => {
    expect(LEVEL_COLORS.Beginner).toBe('#9CA3AF')
    expect(LEVEL_COLORS.Explorer).toBe('#3B82F6')
    expect(LEVEL_COLORS.Legend).toBe('#EF4444')
  })
})

describe('NEXT_LEVELS', () => {
  it('maps each level to the next one', () => {
    expect(NEXT_LEVELS.Beginner).toBe('Explorer')
    expect(NEXT_LEVELS.Explorer).toBe('Achiever')
    expect(NEXT_LEVELS.Champion).toBe('Legend')
    expect(NEXT_LEVELS.Legend).toBe('Max')
  })
})
