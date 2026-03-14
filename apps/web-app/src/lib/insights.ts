import { api } from './axios'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type InsightType = 'SPIKE' | 'POSITIVE' | 'WARNING' | 'TIP'

export interface InsightCard {
  type: InsightType
  title: string
  body: string
  icon: string
  priority: number
}

export interface DeviceInsight {
  id: string
  deviceId: string
  deviceName: string
  weeklySummary: string
  riskLevel: RiskLevel
  riskTags: string[]
  positiveTags: string[]
  insights: InsightCard[]
  generatedAt: string
  fresh: boolean
}

export interface MoodTrendItem {
  checkedInAt: string
  mood: number
  moodLabel: string
  dayLabel: string
}

export interface TopicSummary {
  topics: string[]
  totalQuestionsThisWeek: number
}

export interface RuleSuggestion {
  id: string
  reason: string
  suggestion: string
  ruleType: 'APP' | 'CATEGORY' | 'SCHEDULE'
  target: string
  scheduleStart: string | null
  scheduleEnd: string | null
}

export const insightsApi = {
  get: (deviceId: string) =>
    api.get<DeviceInsight>(`/insights/device/${deviceId}`).then(r => r.data),

  refresh: (deviceId: string) =>
    api.post<DeviceInsight>(`/insights/device/${deviceId}/refresh`).then(r => r.data),
}

export const moodApi = {
  /** 7-day mood trend for a device — used in parent dashboard */
  getHistory: (deviceId: string) =>
    api.get<MoodTrendItem[]>(`/mood/history/${deviceId}`).then(r => r.data),
}

export const studyBuddyApi = {
  /** Topics studied by a student — shown to parent (no raw conversations) */
  getTopics: (studentId: string) =>
    api.get<TopicSummary>('/ai/study-buddy/topics', { params: { studentId } })
       .then(r => r.data),
}

export const ruleSuggestionsApi = {
  getSuggestions: () =>
    api.get<RuleSuggestion[]>('/ai/rule-suggestions').then(r => r.data),
}
