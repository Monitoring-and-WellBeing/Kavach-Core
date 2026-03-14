/**
 * GoalCard — displays a single goal with its progress bar.
 * Used in a mini-list on the Dashboard.
 */
import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'

interface Goal {
  id: string
  title: string
  /** 0–100 */
  progressPercent: number
  emoji?: string
}

interface GoalCardProps {
  goal: Goal
  style?: ViewStyle
}

export function GoalCard({ goal, style }: GoalCardProps) {
  const pct = Math.min(100, Math.max(0, goal.progressPercent))
  const color = pct >= 80 ? '#22C55E' : pct >= 40 ? '#3B82F6' : '#F59E0B'

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        {goal.emoji && <Text style={styles.emoji}>{goal.emoji}</Text>}
        <Text style={styles.title} numberOfLines={1}>
          {goal.title}
        </Text>
        <Text style={[styles.pct, { color }]}>{pct}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: { fontSize: 16 },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  pct: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
})
