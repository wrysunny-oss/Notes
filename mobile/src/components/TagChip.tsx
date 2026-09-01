import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

export default function TagChip({
  name,
  color,
  selected,
  small,
}: {
  name: string
  color?: string
  selected?: boolean
  small?: boolean
}) {
  const c = color || theme.primary
  return (
    <View
      style={[
        styles.chip,
        { borderColor: c },
        selected && { backgroundColor: c, borderColor: c },
        small && styles.small,
      ]}
    >
      <Text style={[styles.text, { color: selected ? '#fff' : c }, small && styles.textSmall]}>
        {name}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
    backgroundColor: 'transparent',
  },
  small: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: '600' },
  textSmall: { fontSize: 11 },
})
