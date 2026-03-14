import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  Badge,
  BadgeCategory,
  BadgeProgress,
  badgesApi,
  CATEGORY_LABELS,
  LEVEL_COLORS,
  NEXT_LEVELS,
} from '../lib/badgesApi'
import { studentDashboardApi } from '../lib/studentApi'

// ── XP Progress Bar ───────────────────────────────────────────────────────────
function XPBar({
  level,
  xp,
  progress,
}: {
  level: string
  xp: number
  progress: number
}) {
  const color = LEVEL_COLORS[level] ?? '#3B82F6'
  return (
    <View style={styles.xpCard}>
      <View style={styles.xpRow}>
        <View style={styles.xpLeft}>
          <Text style={[styles.xpLevel, { color }]}>🏆 {level}</Text>
          <Text style={styles.xpTotal}>{xp} XP total</Text>
        </View>
        <View style={styles.xpRight}>
          <Text style={styles.xpNextLabel}>
            Next: <Text style={styles.xpNextValue}>{NEXT_LEVELS[level] ?? '—'}</Text>
          </Text>
          <Text style={styles.xpPct}>{progress}% there</Text>
        </View>
      </View>
      <View style={styles.xpTrack}>
        <View
          style={[styles.xpFill, { width: `${progress}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  )
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({
  badge,
  onPress,
}: {
  badge: Badge
  onPress: (b: Badge) => void
}) {
  const tierColors: Record<string, string> = {
    GOLD: '#CA8A04',
    SILVER: '#6B7280',
    PLATINUM: '#7C3AED',
    BRONZE: '#92400E',
  }
  const tierColor = tierColors[badge.tier] ?? '#92400E'

  return (
    <TouchableOpacity
      onPress={() => onPress(badge)}
      style={[
        styles.badgeCard,
        !badge.earned && styles.badgeCardLocked,
      ]}
      activeOpacity={0.8}
    >
      {/* Icon */}
      <View
        style={[
          styles.badgeIcon,
          badge.earned ? styles.badgeIconEarned : styles.badgeIconLocked,
        ]}
      >
        {badge.earned ? (
          <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
        ) : (
          <Text style={{ fontSize: 22, color: '#D1D5DB' }}>🔒</Text>
        )}
      </View>

      {/* Tier */}
      <Text style={[styles.badgeTier, { color: tierColor }]}>
        {badge.tier}
      </Text>

      {/* Name */}
      <Text style={styles.badgeName} numberOfLines={2}>
        {badge.name}
      </Text>

      {/* XP */}
      <View style={styles.badgeXp}>
        <Text style={[styles.badgeXpText, !badge.earned && { color: '#D1D5DB' }]}>
          ⚡ +{badge.xpReward}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Badge Detail Modal ────────────────────────────────────────────────────────
function BadgeModal({
  badge,
  onClose,
}: {
  badge: Badge | null
  onClose: () => void
}) {
  if (!badge) return null
  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCard}>
          <Text style={{ fontSize: 52, textAlign: 'center' }}>
            {badge.earned ? badge.icon : '🔒'}
          </Text>
          <Text style={styles.modalName}>{badge.name}</Text>
          <Text style={styles.modalDesc}>{badge.description}</Text>
          <View style={styles.modalXp}>
            <Text style={styles.modalXpText}>⚡ +{badge.xpReward} XP</Text>
          </View>
          {badge.earned && badge.earnedAt && (
            <Text style={styles.modalDate}>
              Earned{' '}
              {new Date(badge.earnedAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}
          {!badge.earned && (
            <Text style={styles.modalLocked}>Keep going to unlock this badge!</Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AchievementsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceLoading, setDeviceLoading] = useState(true)
  const [data, setData] = useState<BadgeProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<BadgeCategory | 'ALL'>('ALL')
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  // Load device ID
  useEffect(() => {
    studentDashboardApi
      .get()
      .then((d) => {
        if (d.deviceLinked && d.deviceId) setDeviceId(d.deviceId)
      })
      .catch(() => {})
      .finally(() => setDeviceLoading(false))
  }, [])

  // Load badge data when deviceId is ready
  useEffect(() => {
    if (!deviceId) return
    setLoading(true)
    badgesApi
      .getProgress(deviceId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [deviceId])

  if (deviceLoading || loading) {
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
            Ask your parent or institute to link a device.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!data) return null

  const CATEGORIES = Object.keys(CATEGORY_LABELS) as BadgeCategory[]
  const filtered =
    filter === 'ALL' ? data.badges : data.badges.filter((b) => b.category === filter)

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>🏆 Achievements</Text>
          <Text style={styles.pageSub}>
            {data.badgesEarned} of {data.badgesTotal} badges earned
          </Text>
        </View>

        {/* ── XP bar ── */}
        <XPBar
          level={String(data.level)}
          xp={data.totalXp}
          progress={data.levelProgress}
        />

        {/* ── Category stats row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {/* All filter chip */}
          <TouchableOpacity
            onPress={() => setFilter('ALL')}
            style={[styles.catChip, filter === 'ALL' && styles.catChipActive]}
          >
            <Text style={styles.catChipEmoji}>🎖️</Text>
            <Text style={[styles.catChipCount, filter === 'ALL' && { color: '#2563EB' }]}>
              {data.badgesEarned}
            </Text>
            <Text style={[styles.catChipLabel, filter === 'ALL' && { color: '#2563EB' }]}>
              All
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_LABELS[cat]
            const count = data.byCategory[cat] ?? 0
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setFilter(filter === cat ? 'ALL' : cat)}
                style={[styles.catChip, filter === cat && styles.catChipActive]}
              >
                <Text style={styles.catChipEmoji}>{cfg.emoji}</Text>
                <Text
                  style={[
                    styles.catChipCount,
                    filter === cat && { color: '#2563EB' },
                  ]}
                >
                  {count}
                </Text>
                <Text
                  style={[
                    styles.catChipLabel,
                    filter === cat && { color: '#2563EB' },
                  ]}
                >
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* ── Recently earned ── */}
        {data.recentlyEarned.length > 0 && (
          <View style={styles.recentCard}>
            <Text style={styles.recentTitle}>⭐ Recently Earned</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {data.recentlyEarned.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.recentBadge}
                  onPress={() => setSelectedBadge(b)}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 26 }}>{b.icon}</Text>
                  <Text style={styles.recentName}>{b.name}</Text>
                  <Text style={styles.recentXp}>+{b.xpReward} XP</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Badge grid ── */}
        <View>
          <View style={styles.gridHeader}>
            <Text style={styles.gridTitle}>
              {filter === 'ALL'
                ? 'All Badges'
                : `${CATEGORY_LABELS[filter as BadgeCategory]?.label} Badges`}{' '}
              <Text style={styles.gridCount}>({filtered.length})</Text>
            </Text>
            {filter !== 'ALL' && (
              <TouchableOpacity onPress={() => setFilter('ALL')}>
                <Text style={styles.showAll}>Show all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* FlatList inside ScrollView — need to disable FlatList scroll */}
          <FlatList
            data={filtered}
            keyExtractor={(b) => b.id}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <BadgeCard badge={item} onPress={setSelectedBadge} />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyBadge}>
                No badges in this category yet
              </Text>
            }
          />
        </View>
      </ScrollView>

      {/* ── Badge detail modal ── */}
      <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 48, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: { gap: 2 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  pageSub: { fontSize: 13, color: '#94A3B8' },

  // XP Bar
  xpCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  xpLeft: { gap: 2 },
  xpLevel: { fontSize: 16, fontWeight: '800' },
  xpTotal: { fontSize: 12, color: '#94A3B8' },
  xpRight: { alignItems: 'flex-end', gap: 2 },
  xpNextLabel: { fontSize: 12, color: '#94A3B8' },
  xpNextValue: { fontWeight: '600', color: '#475569' },
  xpPct: { fontSize: 12, color: '#94A3B8' },
  xpTrack: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: { height: 12, borderRadius: 6 },

  // Category filter chips
  catScroll: { gap: 8, paddingRight: 4 },
  catChip: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minWidth: 64,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  catChipActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  catChipEmoji: { fontSize: 20 },
  catChipCount: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  catChipLabel: { fontSize: 10, color: '#94A3B8', marginTop: 1 },

  // Recently earned
  recentCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  recentTitle: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  recentScroll: { gap: 10 },
  recentBadge: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    width: 80,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    gap: 4,
  },
  recentName: { fontSize: 10, fontWeight: '600', color: '#374151', textAlign: 'center' },
  recentXp: { fontSize: 10, color: '#D97706', fontWeight: '600' },

  // Badge grid
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  gridCount: { fontSize: 14, fontWeight: '400', color: '#94A3B8' },
  showAll: { fontSize: 12, color: '#3B82F6' },
  gridRow: { gap: 10 },

  // Individual badge card (3-col)
  badgeCard: {
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
  badgeCardLocked: { opacity: 0.5 },
  badgeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeIconEarned: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  badgeIconLocked: { backgroundColor: '#F3F4F6' },
  badgeTier: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  badgeXp: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeXpText: { fontSize: 10, color: '#CA8A04', fontWeight: '600' },
  emptyBadge: { textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 24 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  modalName: { fontSize: 20, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  modalXp: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  modalXpText: { fontSize: 14, color: '#D97706', fontWeight: '700' },
  modalDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  modalLocked: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  modalClose: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 12,
  },
  modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Empty / no-device states
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
})
