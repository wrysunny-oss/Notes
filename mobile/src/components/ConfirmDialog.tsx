import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native'
import { useConfirmStore } from '../stores/confirmStore'
import { theme } from '../theme'

export default function ConfirmDialog() {
  const { visible, options, resolve } = useConfirmStore()
  const [busy, setBusy] = React.useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await resolve(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => resolve(false)}>
      <Pressable style={styles.overlay} onPress={() => !busy && resolve(false)}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {options.title ? <Text style={styles.title}>{options.title}</Text> : null}
          {options.message ? <Text style={styles.message}>{options.message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={() => resolve(false)}
              disabled={busy}
            >
              <Text style={styles.cancelText}>{options.cancelText || '取消'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                options.danger ? styles.dangerBtn : styles.primaryBtn,
              ]}
              onPress={handleConfirm}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>
                  {options.confirmText || '确定'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9998,
    elevation: 9998,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelBtn: {
    backgroundColor: theme.bg,
    borderWidth: 1.2,
    borderColor: theme.border,
  },
  confirmBtn: {},
  primaryBtn: { backgroundColor: theme.primary },
  dangerBtn: { backgroundColor: theme.danger },
  cancelText: { color: theme.textMuted, fontWeight: '600', fontSize: 15 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
