import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { challengesApi, StreakInfo } from '../lib/challengesApi'

interface Props {
  deviceId: string
}

export function StreakCard({ deviceId }: Props) {
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [recovering, setRecovering] = useState(false)

  const load = () => {
    if (!deviceId) return
    challengesApi.getStreak(deviceId).then(setStreak).catch(() => {})
  }

  useEffect(() => { load() }, [deviceId])

  const handleRecover = async () => {
    if (!streak || streak.recoveryTokens <= 0) return
    setRecovering(true)
    try {
      const updated = await challengesApi.useRecoveryToken(deviceId)
      setStreak(updated)
    } catch {
      // show nothing — user can try again
    } finally {
      setRecovering(false)
    }
  }

  if (!streak) return null

  const { currentStreak, longestStreak, recoveryTokens, last7Days, dayLabels, streakBroken } = streak

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>
            {streakBroken ? '😢 Streak broken' : `🔥 ${currentStreak}-day streak!`}
          </Text>
          <Text style={styles.sub}>Best: {longestStreak} days</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakNum}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>days</Text>
        </View>
      </View>

      {/* 7-day dots */}
      <View style={styles.dotsRow}>
        {last7Days.map((active, i) => (
          <View key={i} style={styles.dotCol}>
            <View style={[styles.dot, active ? styles.dotActive : styles.dotEmpty]} />
            <Text style={styles.dotLabel}>{dayLabels[i]}</Text>
          </View>
        ))}
      </View>

      {/* Recovery flow */}
      {streakBroken && recoveryTokens > 0 && (
        <TouchableOpacity
          style={styles.recoverBtn}
          onPress={handleRecover}
          disabled={recovering}
          activeOpacity={0.8}
        >
          {recovering ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.recoverText}>
              🛡️ Use recovery token ({recoveryTokens} left)
            </Text>
          )}
        </TouchableOpacity>
      )}

      {streakBroken && recoveryTokens === 0 && (
        <View style={styles.noTokensRow}>
          <Text style={styles.noTokensText}>
            No recovery tokens. Keep going to earn one! 💪
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  sub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  streakBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
  },
  streakNum: { fontSize: 22, fontWeight: '900', color: '#D97706' },
  streakLabel: { fontSize: 9, color: '#92400E', fontWeight: '600' },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dotCol: { alignItems: 'center', gap: 4 },
  dot: { width: 28, height: 28, borderRadius: 14 },
  dotActive: { backgroundColor: '#F97316' },
  dotEmpty: { backgroundColor: '#E2E8F0', borderWidth: 1, borderColor: '#CBD5E1' },
  dotLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },

  recoverBtn: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  recoverText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  noTokensRow: {
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 10,
  },
  noTokensText: { color: '#92400E', fontSize: 12, textAlign: 'center' },
})
