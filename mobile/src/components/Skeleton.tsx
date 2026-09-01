import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export function Skeleton({ width, height = 16, radius = 6, style }: { width: number | string; height?: number; radius?: number; style?: any }) {
  return <View style={[{ width, height, borderRadius: radius, backgroundColor: '#e7e7ef' }, style]} />
}

export function NoteCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="70%" height={18} />
      <Skeleton width="100%" height={14} style={{ marginTop: 10 }} />
      <Skeleton width="40%" height={11} style={{ marginTop: 16 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e7e7ef',
  },
})
