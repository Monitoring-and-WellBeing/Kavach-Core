import { rest } from 'msw'
import { mockBadges } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const badgeHandlers = [
  rest.get(`${BASE}/badges/device/:id`, (req, res, ctx) => {
    return res(ctx.json({
      totalXp: 150,
      badgesEarned: 1,
      badgesTotal: 20,
      level: 1,
      levelProgress: 45,
      badges: mockBadges,
      recentlyEarned: mockBadges,
      byCategory: {
        FOCUS: 1,
        STREAK: 0,
        USAGE: 0,
        REDUCTION: 0,
        MILESTONE: 0,
        SPECIAL: 0,
      },
    }))
  }),

  rest.post(`${BASE}/badges/device/:id/evaluate`, (req, res, ctx) => {
    return res(ctx.json(['badge-001']))
  }),
]
