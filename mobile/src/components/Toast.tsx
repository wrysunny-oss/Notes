import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useToastStore, type ToastType } from '../stores/toastStore'
import { theme } from '../theme'

const ICONS: Record<ToastType, string> = { success: '✓', error: '!', info: 'i' }
const COLORS: Record<ToastType, string> = {
  success: theme.success,
  error: theme.danger,
  info: theme.primary,
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  const insets = useSafeAreaInsets()
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) + 4 }]}
    >
      {toasts.map((t) => {
        const color = COLORS[t.type]
        return (
          <Pressable
            key={t.id}
            onPress={() => dismiss(t.id)}
            style={({ pressed }) => [
              styles.toast,
              { borderLeftColor: color, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: color }]}>
              <Text style={styles.iconText}>{ICONS[t.type]}</Text>
            </View>
            <Text style={styles.text}>{t.message}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(15,23,42,0.18)' },
      default: { shadowColor: '#1e293b', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    }),
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  text: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '500', lineHeight: 20 },
})
