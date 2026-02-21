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
    return res(ctx.json([
      { app: 'Chrome', minutes: 120, percent: 40 },
      { app: 'YouTube', minutes: 60, percent: 20 },
      { app: 'VS Code', minutes: 90, percent: 30 },
    ]))
  }),

  rest.get(`${BASE}/reports/device/:id/categories`, (req, res, ctx) => {
    return res(ctx.json([
      { category: 'EDUCATION', minutes: 90, percent: 30 },
      { category: 'ENTERTAINMENT', minutes: 120, percent: 40 },
      { category: 'PRODUCTIVITY', minutes: 60, percent: 20 },
    ]))
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
