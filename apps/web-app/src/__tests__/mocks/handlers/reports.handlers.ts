import { rest } from 'msw'

const BASE = 'http://localhost:8080/api/v1'

const weeklyData = {
  days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  screenTime: [120, 180, 90, 150, 200, 60, 100],
  focusTime:  [30,  60,  20,  45,  80,  0,  30],
}

export const reportsHandlers = [
  rest.get(`${BASE}/reports/device/:id/weekly`, (req, res, ctx) => {
    return res(ctx.json(weeklyData))
  }),

  rest.get(`${BASE}/reports/device/:id/monthly`, (req, res, ctx) => {
    return res(ctx.json({
      ...weeklyData,
      days: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
      screenTime: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200)),
      focusTime: Array.from({ length: 30 }, () => Math.floor(Math.random() * 60)),
    }))
  }),

  rest.get(`${BASE}/reports/device/:id/apps`, (req, res, ctx) => {
    return res(ctx.json({
      apps: [
        { rank: 1, appName: 'Chrome', category: 'BROWSER', durationSeconds: 7200, durationFormatted: '2h', percentOfTotal: 40, blocked: false },
        { rank: 2, appName: 'YouTube', category: 'ENTERTAINMENT', durationSeconds: 3600, durationFormatted: '1h', percentOfTotal: 20, blocked: false },
        { rank: 3, appName: 'VS Code', category: 'PRODUCTIVITY', durationSeconds: 5400, durationFormatted: '1.5h', percentOfTotal: 30, blocked: false },
      ],
      totalSeconds: 16200,
    }))
  }),

  rest.get(`${BASE}/reports/device/:id/categories`, (req, res, ctx) => {
    return res(ctx.json({
      categories: [
        { category: 'EDUCATION', durationSeconds: 5400, durationFormatted: '1.5h', percentage: 30, color: '#3B82F6' },
        { category: 'ENTERTAINMENT', durationSeconds: 7200, durationFormatted: '2h', percentage: 40, color: '#EF4444' },
        { category: 'PRODUCTIVITY', durationSeconds: 3600, durationFormatted: '1h', percentage: 20, color: '#10B981' },
      ],
      totalSeconds: 16200,
    }))
  }),

  rest.get(`${BASE}/reports/device/:id/heatmap`, (req, res, ctx) => {
    return res(ctx.json(
      Array.from({ length: 7 }, (_, day) =>
        Array.from({ length: 24 }, (_, hour) => ({
          day, hour, value: Math.floor(Math.random() * 60),
        }))
      ).flat()
    ))
  }),
]
