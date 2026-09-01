import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, Pressable, ScrollView } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../stores/authStore'
import { useNotesStore } from '../stores/noteStore'
import type { Note } from '../lib/api'
import NoteCard from '../components/NoteCard'
import EmptyState from '../components/EmptyState'
import TagChip from '../components/TagChip'
import { NoteCardSkeleton } from '../components/Skeleton'
import { theme } from '../theme'

type SortKey = 'updatedAt' | 'createdAt' | 'title'

export default function NotesListScreen() {
  const token = useAuthStore((s) => s.token)!
  const { items, tags, loading, fetchList, fetchTags } = useNotesStore()
  const [keyword, setKeyword] = useState('')
  const [keywordActive, setKeywordActive] = useState('')
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined)
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [showSort, setShowSort] = useState(false)
  const navigation = useNavigation<any>()

  useFocusEffect(
    useCallback(() => {
      fetchList(token)
      fetchTags(token)
    }, [token]),
  )

  function reload(params?: any) {
    fetchList(token, params)
  }

  const visibleNotes: Note[] = useMemo(() => {
    const list = items.filter((n) => !n.deletedAt)
    const cmp = (a: Note, b: Note) => {
      if (sortKey === 'title') return (a.title || '').localeCompare(b.title || '')
      const av = new Date(a[sortKey]).getTime()
      const bv = new Date(b[sortKey]).getTime()
      return bv - av
    }
    const sorted = [...list].sort(cmp)
    // 收藏置顶（仅非"按标题"排序时）
    if (sortKey !== 'title') {
      sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    }
    return sorted
  }, [items, sortKey])

  const hasFilters = !!(keywordActive || filterTag || pinnedOnly)

  return (
    <View style={styles.wrap}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索笔记标题或内容"
            placeholderTextColor={theme.textLight}
            value={keyword}
            returnKeyType="search"
            onSubmitEditing={() => { setKeywordActive(keyword); reload({ keyword }) }}
            onChangeText={setKeyword}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => { setKeyword(''); setKeywordActive(''); reload({ keyword: '' }) }} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(true)}>
          <Text style={styles.sortIcon}>↕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, pinnedOnly && styles.filterChipActive]}
          onPress={() => {
            const v = !pinnedOnly
            setPinnedOnly(v)
            reload({ pinnedOnly: v })
          }}
        >
          <Text style={styles.filterChipEmoji}>★</Text>
          <Text style={[styles.filterText, pinnedOnly && styles.filterTextActive]}>收藏</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScroll}
          contentContainerStyle={styles.tagsScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, !filterTag && styles.filterChipActive]}
            onPress={() => { setFilterTag(undefined); reload({ tagId: undefined }) }}
          >
            <Text style={[styles.filterText, !filterTag && styles.filterTextActive]}>全部</Text>
          </TouchableOpacity>
          {tags.map((t) => {
            const selected = filterTag === t.id
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => { setFilterTag(t.id); reload({ tagId: t.id }) }}
              >
                <TagChip name={t.name} color={t.color} selected={selected} />
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 8 }}
        data={visibleNotes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => reload()} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {Array.from({ length: 4 }).map((_, i) => <NoteCardSkeleton key={i} />)}
            </View>
          ) : (
            <EmptyState
              text={hasFilters ? '没有匹配的笔记' : '还没有任何笔记'}
              hint={hasFilters ? '换个搜索词或过滤条件试试' : '点击右下角按钮，写下第一篇'}
              emoji={hasFilters ? '🔍' : '📝'}
            />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NoteEditor', { id: item.id })}
          >
            <NoteCard note={item} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteEditor', {})}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
        <Text style={styles.fabLabel}>新建</Text>
      </TouchableOpacity>

      <Modal visible={showSort} transparent animationType="slide" onRequestClose={() => setShowSort(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSort(false)}>
          <Pressable style={styles.sortSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>排序方式</Text>
            {([
              { key: 'updatedAt', label: '按更新时间', emoji: '🕒' },
              { key: 'createdAt', label: '按创建时间', emoji: '✨' },
              { key: 'title', label: '按标题', emoji: '🔤' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortOption, sortKey === opt.key && styles.sortOptionActive]}
                onPress={() => { setSortKey(opt.key); setShowSort(false) }}
              >
                <Text style={styles.sortOptionEmoji}>{opt.emoji}</Text>
                <Text style={styles.sortOptionText}>{opt.label}</Text>
                {sortKey === opt.key ? <Text style={styles.sortOptionCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: { fontSize: 14, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 14, color: theme.text, paddingVertical: 0 },
  clearBtn: { paddingHorizontal: 6 },
  clearIcon: { color: theme.textLight, fontSize: 12 },
  sortBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: theme.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIcon: { color: theme.primary, fontSize: 18, fontWeight: '700' },
  filterRow: {
    padding: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: theme.border,
    backgroundColor: 'transparent',
  },
  filterChipActive: { borderColor: theme.primary, backgroundColor: theme.primary },
  filterChipEmoji: { color: theme.warning, fontSize: 12 },
  filterText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  tagsScroll: { flex: 1 },
  tagsScrollContent: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 4 },
  list: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    ...theme.shadow.lg,
  },
  fabText: { color: '#fff', fontSize: 26, fontWeight: '300', marginTop: -2, marginRight: 4 },
  fabLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 9998, elevation: 9998 },
  sortSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    zIndex: 9999,
    elevation: 9999,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 14 },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sortOptionActive: { backgroundColor: theme.primarySoft, borderRadius: 8, paddingHorizontal: 12 },
  sortOptionEmoji: { fontSize: 18 },
  sortOptionText: { flex: 1, fontSize: 15, color: theme.text },
  sortOptionCheck: { color: theme.primary, fontSize: 18, fontWeight: '700' },
})
