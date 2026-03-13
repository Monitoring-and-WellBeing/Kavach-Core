import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { challengesApi, Challenge } from '../lib/challengesApi'

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: '#10B981',
  MEDIUM: '#F59E0B',
  HARD: '#EF4444',
}

interface Props {
  deviceId: string
  onChallengeCompleted?: (challenge: Challenge) => void
}

export function DailyChallenges({ deviceId, onChallengeCompleted }: Props) {
  const [challenges, setChallenges] = useState<Challenge[]>([])

  useEffect(() => {
    if (!deviceId) return
    let cancelled = false

    const prevCompletedIds = new Set(
      challenges.filter((c) => c.completed).map((c) => c.id)
    )

    challengesApi
      .getToday(deviceId)
      .then((data) => {
        if (cancelled) return
        // Detect newly completed challenges for celebration trigger
        if (onChallengeCompleted) {
          data.forEach((c) => {
            if (c.completed && !prevCompletedIds.has(c.id)) {
              onChallengeCompleted(c)
            }
          })
        }
        setChallenges(data)
      })
      .catch(() => {})

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const completedCount = challenges.filter((c) => c.completed).length

  if (challenges.length === 0) return null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Daily Challenges</Text>
        <Text style={styles.progress}>
          {completedCount}/{challenges.length} done
        </Text>
      </View>

      {challenges.map((challenge) => (
        <View
          key={challenge.id}
          style={[styles.card, challenge.completed && styles.cardCompleted]}
        >
          <Text style={styles.icon}>
            {challenge.completed ? '✅' : challenge.icon}
          </Text>

          <View style={styles.info}>
            <Text
              style={[
                styles.challengeTitle,
                challenge.completed && styles.completedText,
              ]}
            >
              {challenge.title}
            </Text>

            {/* Progress bar for incremental challenges */}
            {!challenge.completed && challenge.targetValue > 1 && (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          (challenge.currentValue / challenge.targetValue) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {challenge.currentValue}/{challenge.targetValue}
                </Text>
              </>
            )}
          </View>

          <View style={styles.right}>
            <Text
              style={[
                styles.difficulty,
                { color: DIFFICULTY_COLOR[challenge.difficulty] ?? '#9CA3AF' },
              ]}
            >
              {challenge.difficulty}
            </Text>
            <Text style={styles.xp}>+{challenge.xpReward} XP</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  progress: { fontSize: 12, color: '#64748B' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  icon: { fontSize: 26, marginRight: 12 },

  info: { flex: 1 },
  challengeTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  completedText: { color: '#16A34A', textDecorationLine: 'line-through' },

  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  right: { alignItems: 'flex-end', marginLeft: 8 },
  difficulty: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xp: { fontSize: 13, fontWeight: '800', color: '#2563EB', marginTop: 2 },
})
