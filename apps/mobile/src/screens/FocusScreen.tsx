import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle, G } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'

import { focusApi, FocusSession } from '../lib/focusApi'
import { studentDashboardApi } from '../lib/studentApi'

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: '25 min', value: 25, emoji: '🍅', desc: 'Pomodoro' },
  { label: '45 min', value: 45, emoji: '📚', desc: 'Study block' },
  { label: '60 min', value: 60, emoji: '🎯', desc: 'Deep work' },
  { label: '90 min', value: 90, emoji: '🔥', desc: 'Marathon' },
] as const

type Phase = 'idle' | 'active' | 'done'

// ── Circular timer (SVG) ──────────────────────────────────────────────────────
function CircularTimer({
  timeLeft,
  total,
}: {
  timeLeft: number
  total: number
}) {
  const R = 54
  const CIRC = 2 * Math.PI * R
  const progress = total > 0 ? (total - timeLeft) / total : 0
  const offset = CIRC - progress * CIRC

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <View style={timerStyles.wrapper}>
      <Svg
        width={148}
        height={148}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <G>
          <Circle
            cx={74}
            cy={74}
            r={R}
            stroke="#F1F5F9"
            strokeWidth={10}
            fill="none"
          />
          <Circle
            cx={74}
            cy={74}
            r={R}
            stroke="#3B82F6"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={timerStyles.center}>
        <Text style={timerStyles.time}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
        <Text style={timerStyles.sub}>remaining</Text>
      </View>
    </View>
  )
}

const timerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 148,
    height: 148,
  },
  time: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  sub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
})

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function FocusScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [selected, setSelected] = useState<number>(25)
  const [session, setSession] = useState<FocusSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [history, setHistory] = useState<FocusSession[]>([])
  const [stats, setStats] = useState({ focusMinutesToday: 0, sessionsToday: 0 })
  const [loading, setLoading] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceLoading, setDeviceLoading] = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load device ID from student dashboard ──────────────────────────────────
  useEffect(() => {
    studentDashboardApi
      .get()
      .then((d) => {
        if (d.deviceLinked && d.deviceId) setDeviceId(d.deviceId)
      })
      .catch(() => {})
      .finally(() => setDeviceLoading(false))
  }, [])

  // ── Load active session + history + stats once deviceId is known ───────────
  const loadData = useCallback(async () => {
    if (!deviceId) return
    const [active, hist, todayStats] = await Promise.all([
      focusApi.getActive(deviceId),
      focusApi.getHistory(deviceId),
      focusApi.getTodayStats(deviceId),
    ])
    if (active) {
      setSession(active)
      setTimeLeft(active.remainingSeconds)
      setPhase('active')
    }
    setHistory(hist)
    setStats(todayStats)
  }, [deviceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            handleSessionComplete()
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Keep screen awake while session is active ──────────────────────────────
  useEffect(() => {
    if (phase === 'active') {
      activateKeepAwakeAsync()
    } else {
      deactivateKeepAwake()
    }
  }, [phase])

  const handleSessionComplete = async () => {
    setPhase('done')
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    // Local notification (works even if app is backgrounded)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Focus session complete!',
        body: "Great work! Take a short break.",
        sound: true,
      },
      trigger: null, // fire immediately
    })
  }

  const handleStart = async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const preset = PRESETS.find((p) => p.value === selected)
      const s = await focusApi.selfStart(deviceId, selected, preset?.desc)
      setSession(s)
      setTimeLeft(s.remainingSeconds)
      setPhase('active')
    } catch {
      // handle silently; could show a toast here
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!session) return
    setLoading(true)
    try {
      await focusApi.stop(session.id)
      setSession(null)
      setTimeLeft(0)
      setPhase('idle')
      loadData()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleDone = () => {
    setPhase('idle')
    setSession(null)
    loadData()
  }

  // ── Loading / no-device states ────────────────────────────────────────────
  if (deviceLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color="#2563EB" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!deviceId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>💻</Text>
          <Text style={styles.emptyTitle}>No device linked yet</Text>
          <Text style={styles.emptySub}>
            Ask your parent or institute to link a device to your account.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Focus Mode</Text>
          <Text style={styles.titleSub}>
            {stats.sessionsToday} sessions · {stats.focusMinutesToday} min today
          </Text>
        </View>

        {/* ── IDLE: preset grid ── */}
        {phase === 'idle' && (
          <View style={{ gap: 16 }}>
            <View style={styles.presetGrid}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setSelected(p.value)}
                  style={[
                    styles.presetCard,
                    selected === p.value && styles.presetCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetEmoji}>{p.emoji}</Text>
                  <Text
                    style={[
                      styles.presetLabel,
                      selected === p.value && { color: '#2563EB' },
                    ]}
                  >
                    {p.label}
                  </Text>
                  <Text style={styles.presetDesc}>{p.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startBtn, loading && { opacity: 0.6 }]}
              onPress={handleStart}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startBtnText}>
                  ▶  Start {selected}-min Focus
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── ACTIVE: circular countdown ── */}
        {phase === 'active' && (
          <View style={styles.activeContainer}>
            <CircularTimer
              timeLeft={timeLeft}
              total={(session?.durationMinutes ?? selected) * 60}
            />

            <View style={styles.activeInfo}>
              <Text style={styles.activeTitle}>{session?.title}</Text>
              <Text style={styles.activeSub}>
                {session?.durationMinutes} minute session
              </Text>
            </View>

            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>
                🎯 Stay focused! Only study apps allowed.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.stopBtn, loading && { opacity: 0.6 }]}
              onPress={handleStop}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#64748B" />
              ) : (
                <Text style={styles.stopBtnText}>■  End Session Early</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── DONE: celebration ── */}
        {phase === 'done' && (
          <View style={styles.doneContainer}>
            <View style={styles.doneIcon}>
              <Text style={{ fontSize: 44 }}>🎉</Text>
            </View>
            <Text style={styles.doneTitle}>Session Complete!</Text>
            <Text style={styles.doneSub}>
              You focused for {session?.durationMinutes} minutes. Great work!
            </Text>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={handleDone}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>Start Another</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Session History ── */}
        {history.length > 0 && phase !== 'active' && (
          <View style={{ marginTop: 24, gap: 8 }}>
            <Text style={styles.historyTitle}>⏱ Recent Sessions</Text>
            {history.slice(0, 5).map((s) => (
              <View key={s.id} style={styles.historyItem}>
                <View
                  style={[
                    styles.historyDot,
                    {
                      backgroundColor:
                        s.status === 'COMPLETED'
                          ? '#22C55E'
                          : s.status === 'CANCELLED'
                          ? '#EF4444'
                          : '#D1D5DB',
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyName}>{s.title}</Text>
                  <Text style={styles.historyMeta}>
                    {new Date(s.startedAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    · {s.durationMinutes} min
                  </Text>
                </View>
                <View
                  style={[
                    styles.historyBadge,
                    {
                      backgroundColor:
                        s.status === 'COMPLETED'
                          ? '#DCFCE7'
                          : s.status === 'CANCELLED'
                          ? '#FEE2E2'
                          : '#F3F4F6',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.historyBadgeText,
                      {
                        color:
                          s.status === 'COMPLETED'
                            ? '#16A34A'
                            : s.status === 'CANCELLED'
                            ? '#DC2626'
                            : '#6B7280',
                      },
                    ]}
                  >
                    {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 48, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  titleRow: { alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  titleSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // Preset grid
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  presetCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  presetEmoji: { fontSize: 28 },
  presetLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  presetDesc: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  // Start button
  startBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Active state
  activeContainer: { alignItems: 'center', gap: 20, paddingVertical: 12 },
  activeInfo: { alignItems: 'center' },
  activeTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  activeSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  focusBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  focusBadgeText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  stopBtnText: { color: '#475569', fontSize: 14, fontWeight: '600' },

  // Done state
  doneContainer: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  doneIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  doneSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // History
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#475569' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  historyDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  historyName: { fontSize: 13, color: '#374151', fontWeight: '500' },
  historyMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  historyBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyBadgeText: { fontSize: 11, fontWeight: '600' },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
})
