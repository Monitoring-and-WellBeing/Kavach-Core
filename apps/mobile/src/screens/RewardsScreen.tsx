import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { rewardsApi, Reward, Redemption, STATUS_CONFIG } from '../lib/rewardsApi'
import { badgesApi, BadgeProgress } from '../lib/badgesApi'
import { studentDashboardApi } from '../lib/studentApi'

// ── XP Header ────────────────────────────────────────────────────────────────

function XpHeader({ xp, level, progress }: { xp: number; level: string; progress: number }) {
  return (
    <View style={styles.xpCard}>
      <View style={styles.xpRow}>
        <View>
          <Text style={styles.xpValue}>✨ {xp} XP</Text>
          <Text style={styles.xpLevel}>Level: {level}</Text>
        </View>
        <Text style={styles.xpHint}>Spend your XP on rewards below</Text>
      </View>
      {/* Progress bar */}
      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${Math.min(progress, 100)}%` as any }]} />
      </View>
    </View>
  )
}

// ── Reward Card ───────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  canAfford,
  onPress,
}: {
  reward: Reward
  canAfford: boolean
  onPress: (r: Reward) => void
}) {
  return (
    <TouchableOpacity
      style={[styles.rewardCard, !canAfford && styles.rewardCardDisabled]}
      onPress={() => canAfford && onPress(reward)}
      activeOpacity={canAfford ? 0.8 : 1}
    >
      <Text style={styles.rewardIcon}>{reward.icon}</Text>
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle} numberOfLines={1}>{reward.title}</Text>
        {reward.description ? (
          <Text style={styles.rewardDesc} numberOfLines={1}>{reward.description}</Text>
        ) : null}
      </View>
      <View style={styles.rewardCostBox}>
        <Text style={[styles.rewardCostNum, !canAfford && styles.rewardCostNumLow]}>
          {reward.xpCost}
        </Text>
        <Text style={styles.rewardCostLabel}>XP</Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Redemption Row ────────────────────────────────────────────────────────────

function RedemptionRow({ item }: { item: Redemption }) {
  const cfg = STATUS_CONFIG[item.status]
  return (
    <View style={styles.redemptionRow}>
      <Text style={styles.redemptionIcon}>{item.reward?.icon ?? '🎁'}</Text>
      <View style={styles.redemptionInfo}>
        <Text style={styles.redemptionTitle} numberOfLines={1}>{item.reward?.title}</Text>
        <Text style={styles.redemptionTime}>{item.requestedAtRelative}</Text>
        {item.parentNote ? (
          <Text style={styles.parentNote} numberOfLines={1}>
            Parent: "{item.parentNote}"
          </Text>
        ) : null}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  )
}

// ── Redeem Bottom Sheet Modal ─────────────────────────────────────────────────

function RedeemModal({
  reward,
  xp,
  onConfirm,
  onClose,
  loading,
}: {
  reward: Reward | null
  xp: number
  onConfirm: (note: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [note, setNote] = useState('')

  if (!reward) return null

  const afterXp = xp - reward.xpCost
  return (
    <Modal visible={!!reward} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalTitle}>
            {reward.icon}  {reward.title}
          </Text>
          <Text style={styles.modalDesc}>{reward.description}</Text>

          <View style={styles.modalXpRow}>
            <View style={styles.modalXpChip}>
              <Text style={styles.modalXpChipText}>Costs {reward.xpCost} XP</Text>
            </View>
            <View style={styles.modalXpChipGray}>
              <Text style={styles.modalXpChipGrayText}>
                You have {xp} XP
              </Text>
            </View>
            <View style={[styles.modalXpChip, afterXp < 0 && { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.modalXpChipText, afterXp < 0 && { color: '#DC2626' }]}>
                After: {afterXp} XP
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Add a note for your parent (optional)..."
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonLoading]}
            onPress={() => onConfirm(note)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Send Request to Parent 🚀</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function RewardsScreen() {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // ── Calculate available XP (earned - PENDING/APPROVED/FULFILLED spent) ──────
  const totalXp = Number(badgeProgress?.totalXp ?? 0)
  const pendingSpent = redemptions
    .filter(r => r.status === 'PENDING' || r.status === 'APPROVED' || r.status === 'FULFILLED')
    .reduce((sum, r) => sum + r.xpSpent, 0)
  const availableXp = Math.max(0, totalXp - pendingSpent)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true)
    try {
      // First get deviceId
      const dashboard = await studentDashboardApi.get()
      const devId = dashboard.deviceLinked ? (dashboard.deviceId ?? null) : null
      setDeviceId(devId)

      if (devId) {
        const [rw, rd, bp] = await Promise.all([
          rewardsApi.getAvailable(),
          rewardsApi.getMine(),
          badgesApi.getProgress(devId),
        ])
        setRewards(rw)
        setRedemptions(rd)
        setBadgeProgress(bp)
      } else {
        const [rw, rd] = await Promise.all([
          rewardsApi.getAvailable(),
          rewardsApi.getMine(),
        ])
        setRewards(rw)
        setRedemptions(rd)
      }
    } catch {
      // Silently fail; user can refresh
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData(true)
  }

  const handleRedeem = async (note: string) => {
    if (!selectedReward || !deviceId) return
    setRedeemLoading(true)
    try {
      const newRedemption = await rewardsApi.redeem(selectedReward.id, deviceId, note)
      setRedemptions(prev => [newRedemption, ...prev])
      setSelectedReward(null)
      Alert.alert(
        '🎉 Request Sent!',
        `Your request for "${selectedReward.title}" has been sent to your parent. They\'ll review it soon!`,
        [{ text: 'OK' }]
      )
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send request. Please try again.'
      Alert.alert('Oops!', msg)
    } finally {
      setRedeemLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    )
  }

  const level = String(badgeProgress?.level ?? 'Beginner')
  const levelProgress = badgeProgress?.levelProgress ?? 0

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563EB" />
        }
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>🎁 Rewards</Text>
          <Text style={styles.pageSub}>Redeem your XP for real-world rewards</Text>
        </View>

        {/* ── XP Header ── */}
        <XpHeader xp={availableXp} level={level} progress={levelProgress} />

        {/* ── Available Rewards ── */}
        <Text style={styles.sectionTitle}>Available Rewards</Text>

        {rewards.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>No rewards available yet</Text>
            <Text style={styles.emptySubText}>Ask your parent to add some!</Text>
          </View>
        ) : (
          <FlatList
            data={rewards}
            keyExtractor={r => r.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <RewardCard
                reward={item}
                canAfford={availableXp >= item.xpCost}
                onPress={setSelectedReward}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 4 }}
          />
        )}

        {/* ── My Requests ── */}
        {redemptions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Requests</Text>
            <View style={styles.redemptionsCard}>
              {redemptions.map((r, i) => (
                <React.Fragment key={r.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <RedemptionRow item={r} />
                </React.Fragment>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Redeem modal ── */}
      <RedeemModal
        reward={selectedReward}
        xp={availableXp}
        onConfirm={handleRedeem}
        onClose={() => setSelectedReward(null)}
        loading={redeemLoading}
      />
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 48, gap: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  pageSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  // XP card
  xpCard: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 14,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  xpLevel: { fontSize: 12, color: '#BFDBFE', marginTop: 2 },
  xpHint: { fontSize: 11, color: '#93C5FD', textAlign: 'right', maxWidth: 120 },
  xpTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: 10, backgroundColor: '#fff', borderRadius: 5 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },

  // Reward card
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rewardCardDisabled: { opacity: 0.4 },
  rewardIcon: { fontSize: 32, marginRight: 14 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  rewardDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  rewardCostBox: { alignItems: 'center', minWidth: 44 },
  rewardCostNum: { fontSize: 22, fontWeight: '800', color: '#2563EB' },
  rewardCostNumLow: { color: '#CBD5E1' },
  rewardCostLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },

  // Redemptions
  redemptionsCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  redemptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  redemptionIcon: { fontSize: 24, marginRight: 12 },
  redemptionInfo: { flex: 1 },
  redemptionTitle: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  redemptionTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  parentNote: { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 12 },

  // Empty state
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  emptySubText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 16,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    marginTop: -8,
  },
  modalXpRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modalXpChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalXpChipText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  modalXpChipGray: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalXpChipGrayText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  noteInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonLoading: { opacity: 0.7 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: '#94A3B8', fontSize: 14 },
})
