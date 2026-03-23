/**
 * FocusTimer — reusable circular SVG countdown ring.
 * Used in FocusScreen and optionally in DashboardScreen banners.
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'

interface FocusTimerProps {
  /** Seconds remaining */
  timeLeft: number
  /** Total session seconds (used to compute progress arc) */
  totalSeconds: number
  /** Diameter of the ring in logical pixels. Default 148. */
  size?: number
  /** Ring stroke colour. Default '#3B82F6' */
  color?: string
}

export function FocusTimer({
  timeLeft,
  totalSeconds,
  size = 148,
  color = '#3B82F6',
}: FocusTimerProps) {
  const radius = (size - 20) / 2 // 10px padding each side for stroke
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0
  const offset = circ - progress * circ

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <G>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={10}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={color}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>

      {/* Time label centred over the SVG */}
      <View style={[StyleSheet.absoluteFillObject, styles.labelContainer]}>
        <Text style={styles.timeText}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.subText}>remaining</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  subText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
})
