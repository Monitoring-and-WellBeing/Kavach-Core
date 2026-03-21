import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { moodApi } from '../lib/challengesApi'

const MOODS = [
  { value: 1, emoji: '😢', label: 'Awful' },
  { value: 2, emoji: '😟', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great!' },
]

interface Props {
  deviceId: string
  onCheckedIn?: (mood: number) => void
}

export function MoodCheckin({ deviceId, onCheckedIn }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)

  // Check if already submitted today
  useEffect(() => {
    if (!deviceId) return
    moodApi
      .getToday(deviceId)
      .then((res) => {
        if ('mood' in res) {
          setSelected(res.mood)
          setSubmitted(true)
          setAlreadyCheckedIn(true)
        }
      })
      .catch(() => {})
  }, [deviceId])

  const handleSelect = async (mood: number) => {
    if (submitted) return
    setSelected(mood)
    setLoading(true)
    try {
      await moodApi.submit(deviceId, mood)
      setSubmitted(true)
      onCheckedIn?.(mood)
    } catch {
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const selectedMood = MOODS.find((m) => m.value === selected)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>😊 How are you feeling?</Text>
        {!submitted && (
          <Text style={styles.sub}>Tap to check in · earn +10 XP</Text>
        )}
      </View>

      {submitted ? (
        /* Already checked in */
        <View style={styles.doneRow}>
          <Text style={styles.doneEmoji}>{selectedMood?.emoji ?? '😊'}</Text>
          <View>
            <Text style={styles.doneLabel}>
              {alreadyCheckedIn ? "Today's mood" : 'Checked in!'}
            </Text>
            <Text style={styles.doneMoodName}>{selectedMood?.label}</Text>
            {!alreadyCheckedIn && (
              <Text style={styles.xpEarned}>+10 XP earned ✅</Text>
            )}
          </View>
        </View>
      ) : (
        /* Mood picker */
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              onPress={() => handleSelect(m.value)}
              style={[
                styles.moodBtn,
                selected === m.value && styles.moodBtnSelected,
              ]}
              disabled={loading}
              activeOpacity={0.75}
            >
              {loading && selected === m.value ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
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
  header: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  sub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
    backgroundColor: '#F8FAFC',
    minHeight: 64,
    justifyContent: 'center',
  },
  moodBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 9, color: '#64748B', marginTop: 3, fontWeight: '600' },

  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  doneEmoji: { fontSize: 44 },
  doneLabel: { fontSize: 11, color: '#94A3B8' },
  doneMoodName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  xpEarned: { fontSize: 11, color: '#16A34A', fontWeight: '600', marginTop: 2 },
})
