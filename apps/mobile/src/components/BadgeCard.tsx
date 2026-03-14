/**
 * BadgeCard — renders a single badge tile (earned or locked).
 * Tapping it fires onPress so the parent can show a detail modal.
 */
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Badge } from '../lib/badgesApi'

const TIER_COLORS: Record<string, string> = {
  GOLD: '#CA8A04',
  SILVER: '#6B7280',
  PLATINUM: '#7C3AED',
  BRONZE: '#92400E',
}

interface BadgeCardProps {
  badge: Badge
  onPress?: (badge: Badge) => void
}

export function BadgeCard({ badge, onPress }: BadgeCardProps) {
  const tierColor = TIER_COLORS[badge.tier] ?? '#92400E'

  return (
    <TouchableOpacity
      onPress={() => onPress?.(badge)}
      activeOpacity={0.8}
      style={[styles.card, !badge.earned && styles.locked]}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, badge.earned ? styles.iconEarned : styles.iconLocked]}>
        {badge.earned ? (
          <Text style={{ fontSize: 24 }}>{badge.icon}</Text>
        ) : (
          <Text style={{ fontSize: 20, color: '#D1D5DB' }}>🔒</Text>
        )}
      </View>

      {/* Tier label */}
      <Text style={[styles.tier, { color: tierColor }]}>{badge.tier}</Text>

      {/* Badge name */}
      <Text style={styles.name} numberOfLines={2}>
        {badge.name}
      </Text>

      {/* XP pill */}
      <View style={styles.xpPill}>
        <Text style={[styles.xpText, !badge.earned && styles.xpLocked]}>
          ⚡ +{badge.xpReward}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  locked: { opacity: 0.5 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconEarned: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconLocked: { backgroundColor: '#F3F4F6' },
  tier: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  name: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  xpPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  xpText: { fontSize: 10, color: '#CA8A04', fontWeight: '600' },
  xpLocked: { color: '#D1D5DB' },
})
