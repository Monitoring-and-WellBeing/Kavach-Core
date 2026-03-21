/**
 * WeeklyChart — a minimal bar chart built entirely from React Native core
 * primitives. No external chart library required.
 *
 * Each bar is a proportionally-sized View inside a fixed-height track.
 * Today's bar is highlighted in blue; the rest use a light blue tint.
 */
import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { WeeklyPoint } from '../lib/studentApi'

const SCREEN_W = Dimensions.get('window').width
const BLUE = '#3B82F6'
const BAR_HEIGHT = 72

interface WeeklyChartProps {
  data: WeeklyPoint[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    )
  }

  const max = Math.max(...data.map((d) => d.screenTimeSeconds), 1)
  const today = new Date().toISOString().slice(0, 10)

  // Available width minus container padding (20 * 2) and inter-bar gaps
  const totalGaps = (data.length - 1) * 8
  const barW = (SCREEN_W - 40 - totalGaps) / data.length

  return (
    <View style={styles.container}>
      {data.map((d) => {
        const pct = d.screenTimeSeconds / max
        const barH = Math.max(4, pct * BAR_HEIGHT)
        const isToday = d.date === today

        return (
          <View key={d.date} style={[styles.col, { width: barW }]}>
            {/* Track */}
            <View style={styles.track}>
              {/* Fill grows from bottom */}
              <View
                style={[
                  styles.fill,
                  {
                    height: barH,
                    backgroundColor: isToday ? BLUE : '#DBEAFE',
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, isToday && { color: BLUE, fontWeight: '700' }]}>
              {d.dayLabel.slice(0, 1)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: BAR_HEIGHT + 20, // bars + label height
  },
  col: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  track: {
    width: '100%',
    height: BAR_HEIGHT,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  empty: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#D1D5DB',
    fontSize: 13,
  },
})
