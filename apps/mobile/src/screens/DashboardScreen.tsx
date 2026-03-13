import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, G } from 'react-native-svg'

import { useAuth } from '../context/AuthContext'
import {
  CAT_COLORS,
  CAT_LABELS,
  StudentDashboard,
  studentDashboardApi,
} from '../lib/studentApi'
import { focusApi } from '../lib/focusApi'
import { DailyChallenges } from '../components/DailyChallenges'
import { StreakCard } from '../components/StreakCard'
import { Celebration } from '../components/Celebration'
import { MoodCheckin } from '../components/MoodCheckIn'
import { Challenge } from '../lib/challengesApi'
import { api } from '../lib/axios'

const { width: SCREEN_W } = Dimensions.get('window')
const BLUE = '#2563EB'

// ── Focus Score Ring ──────────────────────────────────────────────────────────
function FocusScoreRing({ score }: { score: number }) {
  const R = 42
  const CIRC = 2 * Math.PI * R
  const offset = CIRC - (score / 100) * CIRC
  const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 70 ? 'Great! 🎉' : score >= 40 ? 'Good 👍' : 'Keep going 💪'

  return (
    <View style={styles.ringWrapper}>
      {/* SVG is rendered -90° so arc starts from top */}
      <Svg width={112} height={112} style={{ transform: [{ rotate: '-90deg' }] }}>
        <G>
          <Circle cx={56} cy={56} r={R} stroke="#F1F5F9" strokeWidth={10} fill="none" />
          <Circle
            cx={56}
            cy={56}
            r={R}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      {/* Centre label — absolute over SVG */}
      <View style={styles.ringCenter}>
        <Text style={styles.ringScore}>{score}</Text>
        <Text style={styles.ringMax}>/ 100</Text>
      </View>
      <Text style={[styles.ringLabel, { color }]}>{label}</Text>
      <Text style={styles.ringSubLabel}>Focus Score</Text>
    </View>
  )
}

// ── Weekly Mini Chart (pure React Native — no external chart lib needed) ──────
function WeeklyMiniChart({ data }: { data: StudentDashboard['weeklyData'] }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.screenTimeSeconds), 1)
  const today = new Date().toISOString().slice(0, 10)
  const BAR_W = (SCREEN_W - 48 - 16 * (data.length - 1)) / data.length

  return (
    <View style={styles.chartContainer}>
      {data.map((d) => {
        const pct = d.screenTimeSeconds / max
        const isToday = d.date === today
        const barH = Math.max(4, pct * 60)

        return (
          <View key={d.date} style={[styles.chartBarCol, { width: BAR_W }]}>
            <View style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    height: barH,
                    backgroundColor: isToday ? BLUE : '#DBEAFE',
                  },
                ]}
              />
            </View>
            <Text style={[styles.chartLabel, isToday && { color: BLUE }]}>
              {d.dayLabel.slice(0, 1)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

// ── Active Focus Banner ───────────────────────────────────────────────────────
function ActiveFocusBanner({
  session,
  onStop,
}: {
  session: NonNullable<StudentDashboard['activeFocusSession']>
  onStop: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(session.remainingSeconds)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ref.current = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000
    )
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [])

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Text style={{ fontSize: 18 }}>🎯</Text>
      </View>
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={styles.bannerSub}>Focus mode active</Text>
      </View>
      <Text style={styles.bannerTimer}>
        {mins}:{secs.toString().padStart(2, '0')}
      </Text>
      <TouchableOpacity onPress={onStop} style={styles.bannerStop}>
        <Text style={{ color: '#fff', fontSize: 12 }}>■</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Stat Row Item ─────────────────────────────────────────────────────────────
function StatItem({
  emoji,
  value,
  label,
  bg,
}: {
  emoji: string
  value: string
  label: string
  bg: string
}) {
  return (
    <View style={[styles.statItem, { backgroundColor: bg }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const [data, setData] = useState<StudentDashboard | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [motivation, setMotivation] = useState<string | null>(null)
  // Celebration overlay state
  const [celebration, setCelebration] = useState<{
    visible: boolean
    message: string
    emoji: string
  }>({ visible: false, message: '', emoji: '🎉' })

  const showCelebration = (message: string, emoji = '🎉') =>
    setCelebration({ visible: true, message, emoji })

  const load = useCallback(async () => {
    try {
      const d = await studentDashboardApi.get()
      setData(d)
    } catch {
      // silently fail on background refresh
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  // Fetch daily motivational message
  useEffect(() => {
    if (!data?.deviceId) return
    api
      .get(`/ai/motivation/${data.deviceId}`)
      .then((res) => setMotivation(res.data.message))
      .catch(() => {})
  }, [data?.deviceId])

  // Handlers for challenge completion celebration
  const handleChallengeCompleted = (challenge: Challenge) => {
    showCelebration(`Challenge complete!\n${challenge.title}`, challenge.icon)
  }

  const handleMoodCheckin = (mood: number) => {
    if (mood >= 4) showCelebration('Mood checked in! +10 XP', '😊')
  }

  const handleStopFocus = async () => {
    if (!data?.activeFocusSession) return
    try {
      await focusApi.stop(data.activeFocusSession.sessionId)
      load()
    } catch {}
  }

  const handleStartFocus = async () => {
    if (!data?.deviceId) return
    try {
      await focusApi.selfStart(data.deviceId, 25, 'Pomodoro')
      load()
    } catch {}
  }

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'Student'

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, padding: 20, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                height: i === 1 ? 80 : 120,
                backgroundColor: '#fff',
                borderRadius: 16,
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    )
  }

  // ── No device linked ──────────────────────────────────────────────────────
  if (!data || !data.deviceLinked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>💻</Text>
          <Text style={styles.emptyTitle}>No device linked yet</Text>
          <Text style={styles.emptySub}>
            Ask your parent or institute to link a device to your account.
          </Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const totalCatSecs = data.categories.reduce(
    (s, c) => s + c.durationSeconds,
    0
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load() }}
            tintColor={BLUE}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {data.streak}</Text>
          </View>
        </View>

        {/* ── Daily Motivational Message ── */}
        {motivation ? (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>{motivation}</Text>
          </View>
        ) : null}

        {/* ── Mood Check-in ── */}
        {data.deviceId && (
          <MoodCheckin
            deviceId={data.deviceId}
            onCheckedIn={handleMoodCheckin}
          />
        )}

        {/* ── Active focus banner ── */}
        {data.activeFocusSession && (
          <ActiveFocusBanner
            session={data.activeFocusSession}
            onStop={handleStopFocus}
          />
        )}

        {/* ── Focus Score + Stats ── */}
        <View style={styles.row}>
          <View style={[styles.card, styles.scoreCard]}>
            <FocusScoreRing score={data.focusScore} />
          </View>
          <View style={styles.statsCol}>
            <StatItem
              emoji="⏰"
              value={data.stats.screenTimeFormatted}
              label="Screen time"
              bg="#EFF6FF"
            />
            <StatItem
              emoji="🎯"
              value={`${data.stats.focusMinutesToday}m`}
              label="Focus time"
              bg="#F5F3FF"
            />
            <StatItem
              emoji="✅"
              value={`${data.stats.focusSessionsToday}`}
              label="Sessions"
              bg="#F0FDF4"
            />
          </View>
        </View>

        {/* ── Quick action — Start Focus ── */}
        {!data.activeFocusSession && (
          <TouchableOpacity
            style={styles.startFocusBtn}
            onPress={handleStartFocus}
            activeOpacity={0.85}
          >
            <Text style={styles.startFocusText}>▶  Start 25-min Focus Session</Text>
          </TouchableOpacity>
        )}

        {/* ── Streak card ── */}
        {data.deviceId && <StreakCard deviceId={data.deviceId} />}

        {/* ── Daily Challenges ── */}
        {data.deviceId && (
          <View style={styles.card}>
            <DailyChallenges
              deviceId={data.deviceId}
              onChallengeCompleted={handleChallengeCompleted}
            />
          </View>
        )}

        {/* ── Weekly chart ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>This Week</Text>
              <Text style={styles.cardSub}>Daily screen time</Text>
            </View>
            <Text>📈</Text>
          </View>
          <WeeklyMiniChart data={data.weeklyData} />
        </View>

        {/* ── Category breakdown ── */}
        {data.categories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Breakdown</Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {data.categories.slice(0, 5).map((cat) => {
                const pct =
                  totalCatSecs > 0
                    ? Math.round((cat.durationSeconds / totalCatSecs) * 100)
                    : 0
                const mins = Math.floor(cat.durationSeconds / 60)
                const color = CAT_COLORS[cat.category] ?? '#9CA3AF'

                return (
                  <View key={cat.category}>
                    <View style={styles.catRow}>
                      <Text style={styles.catLabel}>
                        {CAT_LABELS[cat.category] ?? cat.category}
                      </Text>
                      <Text style={styles.catValue}>
                        {mins}m · {pct}%
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${pct}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* ── Top Apps ── */}
        {data.topApps.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Apps Today</Text>
            <View style={{ marginTop: 10 }}>
              {data.topApps.map((app, i) => (
                <View key={app.appName} style={styles.appRow}>
                  <Text style={styles.appRank}>{i + 1}</Text>
                  <View
                    style={[
                      styles.appDot,
                      {
                        backgroundColor:
                          CAT_COLORS[app.category] ?? '#9CA3AF',
                      },
                    ]}
                  />
                  <Text style={styles.appName} numberOfLines={1}>
                    {app.appName}
                  </Text>
                  <Text style={styles.appTime}>
                    {Math.floor(app.durationSeconds / 60)}m
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Sign out ── */}
        <TouchableOpacity onPress={logout} style={styles.signOutRow}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Celebration overlay ── */}
      <Celebration
        visible={celebration.visible}
        message={celebration.message}
        emoji={celebration.emoji}
        onDone={() => setCelebration((c) => ({ ...c, visible: false }))}
      />
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  greeting: { fontSize: 13, color: '#64748B' },
  name: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  streakBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakText: { fontSize: 13, fontWeight: '700', color: '#D97706' },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: { color: '#fff', fontWeight: '600', fontSize: 13 },
  bannerSub: { color: '#BFDBFE', fontSize: 11, marginTop: 1 },
  bannerTimer: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bannerStop: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  cardSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Score + Stats row
  row: { flexDirection: 'row', gap: 12 },
  scoreCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statsCol: { flex: 1, gap: 8 },

  // Focus score ring
  ringWrapper: { alignItems: 'center' },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  ringMax: { fontSize: 11, color: '#94A3B8' },
  ringLabel: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  ringSubLabel: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  // Stat items
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-start',
  },
  statEmoji: { fontSize: 16 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 1 },

  // Start focus button
  startFocusBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  startFocusText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Weekly chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 80,
  },
  chartBarCol: { alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  chartBarTrack: {
    width: '100%',
    height: 60,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: { borderRadius: 4, width: '100%' },
  chartLabel: { fontSize: 10, color: '#94A3B8' },

  // Category breakdown
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catLabel: { fontSize: 12, color: '#475569' },
  catValue: { fontSize: 12, color: '#94A3B8' },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },

  // App rows
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 8,
  },
  appRank: { fontSize: 11, color: '#CBD5E1', width: 14 },
  appDot: { width: 8, height: 8, borderRadius: 4 },
  appName: { flex: 1, fontSize: 13, color: '#374151' },
  appTime: { fontSize: 12, color: '#94A3B8' },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  // Daily motivation card
  motivationCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  motivationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Sign out
  signOutRow: { alignItems: 'center', marginTop: 4 },
  signOutText: { color: '#94A3B8', fontSize: 13 },

  // Logout button (on no-device screen)
  logoutBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
})

