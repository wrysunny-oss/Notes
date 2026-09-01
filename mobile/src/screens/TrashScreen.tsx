import React, { useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { useNotesStore } from '../stores/noteStore'
import NoteCard from '../components/NoteCard'
import EmptyState from '../components/EmptyState'
import { toast } from '../stores/toastStore'
import { confirm } from '../stores/confirmStore'
import { theme, timeAgo } from '../theme'

export default function TrashScreen() {
  const token = useAuthStore((s) => s.token)!
  const { items, loading, fetchList, restoreNote, removeNote, emptyTrash } = useNotesStore()

  useFocusEffect(
    useCallback(() => {
      fetchList(token, { trashed: true })
    }, [token]),
  )

  async function onEmpty() {
    if (items.length === 0) return
    const ok = await confirm({
      title: '清空回收站',
      message: '彻底删除所有回收站笔记？此操作不可撤销',
      confirmText: '清空',
      danger: true,
    })
    if (!ok) return
    try {
      const count = await emptyTrash(token)
      toast.success(`已清空，删除了 ${count} 篇笔记`)
    } catch (e: any) {
      toast.error('操作失败：' + e.message)
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🗑</Text>
          <View>
            <Text style={styles.headerTitle}>回收站</Text>
            <Text style={styles.headerHint}>{items.length} 篇已删除笔记</Text>
          </View>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={onEmpty} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>清空</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 8 }}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => fetchList(token, { trashed: true })} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState emoji="♻️" text="回收站为空" hint="删除的笔记会在这里保留，可随时恢复" /> : null
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <View style={styles.deletedBadge}>
              <Text style={styles.deletedBadgeText}>已删除 · {timeAgo(item.deletedAt!)}</Text>
            </View>
            <NoteCard note={item} />
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.restoreBtn]}
                onPress={async () => {
                  const ok = await confirm({
                    title: '恢复笔记',
                    message: `恢复「${item.title || '无标题'}」到列表？`,
                    confirmText: '恢复',
                  })
                  if (!ok) return
                  try {
                    await restoreNote(token, item.id)
                    toast.success('已恢复')
                  } catch (e: any) {
                    toast.error('恢复失败：' + e.message)
                  }
                }}
              >
                <Text style={styles.restoreText}>↩ 恢复</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.permanentBtn]}
                onPress={async () => {
                  const ok = await confirm({
                    title: '永久删除',
                    message: `永久删除「${item.title || '无标题'}」？此操作不可撤销`,
                    confirmText: '永久删除',
                    danger: true,
                  })
                  if (!ok) return
                  try {
                    await removeNote(token, item.id)
                    toast.success('已永久删除')
                  } catch (e: any) {
                    toast.error('删除失败：' + e.message)
                  }
                }}
              >
                <Text style={styles.permanentText}>永久删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  headerHint: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  emptyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.danger + '18',
  },
  emptyBtnText: { color: theme.danger, fontSize: 13, fontWeight: '700' },
  list: { flex: 1 },
  cardWrap: { marginBottom: 12, position: 'relative' },
  deletedBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: theme.danger + '22',
  },
  deletedBadgeText: { color: theme.danger, fontSize: 10, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.2 },
  restoreBtn: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
  restoreText: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  permanentBtn: { borderColor: theme.danger + '55', backgroundColor: theme.danger + '10' },
  permanentText: { color: theme.danger, fontSize: 13, fontWeight: '600' },
})
