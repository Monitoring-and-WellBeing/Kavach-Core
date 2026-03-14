import React, { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'

interface CelebrationProps {
  visible: boolean
  message: string
  emoji?: string
  onDone: () => void
}

export function Celebration({
  visible,
  message,
  emoji = '🎉',
  onDone,
}: CelebrationProps) {
  const scale = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      scale.setValue(0)
      opacity.setValue(0)
      return
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scale.setValue(0)
      onDone()
    })
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Floating emoji burst */}
        <View style={styles.emojiBurst}>
          {['🎊', '✨', '⭐', '🎉'].map((e, i) => (
            <Text key={i} style={[styles.burstEmoji, BURST_POSITIONS[i]]}>
              {e}
            </Text>
          ))}
        </View>

        <Text style={styles.mainEmoji}>{emoji}</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Animated.View>
  )
}

const BURST_POSITIONS = [
  { position: 'absolute' as const, top: -16, left: 8, fontSize: 20 },
  { position: 'absolute' as const, top: -20, right: 12, fontSize: 16 },
  { position: 'absolute' as const, top: -10, left: '40%' as unknown as number, fontSize: 18 },
  { position: 'absolute' as const, bottom: -12, right: 20, fontSize: 14 },
]

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 40,
    paddingVertical: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
    maxWidth: 300,
  },
  emojiBurst: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  burstEmoji: { position: 'absolute' },
  mainEmoji: { fontSize: 68, marginBottom: 14 },
  message: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 28,
  },
})
