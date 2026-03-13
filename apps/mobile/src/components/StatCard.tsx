/**
 * StatCard — a compact metric tile used in the Dashboard stats row.
 */
import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'

interface StatCardProps {
  emoji: string
  value: string
  label: string
  /** Background colour of the card. */
  bg?: string
  style?: ViewStyle
}

export function StatCard({ emoji, value, label, bg = '#F8FAFC', style }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    flex: 1,
  },
  emoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
})
