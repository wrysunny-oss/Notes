import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

export default function EmptyState({
  emoji = '📝',
  text = '暂无笔记',
  hint,
  action,
}: {
  emoji?: string
  text?: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: { fontSize: 44 },
  text: { fontSize: 16, color: theme.text, fontWeight: '600' },
  hint: { marginTop: 6, fontSize: 13, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
})
