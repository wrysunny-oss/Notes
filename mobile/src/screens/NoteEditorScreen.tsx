import React, { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Pressable } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/authStore'
import { useNotesStore } from '../stores/noteStore'
import { api } from '../lib/api'
import Markdown from '../components/Markdown'
import TagChip from '../components/TagChip'
import { toast } from '../stores/toastStore'
import { confirm } from '../stores/confirmStore'
import { theme, countWords, countChars } from '../theme'
import type { RootStackParamList } from '../navigation/AppNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>

type Mode = 'edit' | 'preview'

function draftKey(userId: string, noteId: string | undefined) {
  return `@clound_note/draft/${userId}/${noteId || 'new'}`
}

export default function NoteEditorScreen({ route, navigation }: Props) {
  const id = route.params?.id
  const token = useAuthStore((s) => s.token)!
  const userId = useAuthStore((s) => s.user?.id) || 'anon'
  const { tags, fetchTags, createNote, updateNote, removeNote } = useNotesStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('edit')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showTagSheet, setShowTagSheet] = useState(false)
  const [newTag, setNewTag] = useState('')
  const draftTimer = useRef<any>(null)
  const saveRef = useRef<() => void>(() => {})

  const setHeaderButtons = useCallback(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{title || '无标题'}</Text>
          <Text style={{ fontSize: 11, color: theme.textLight, marginTop: 2 }}>
            {lastSavedAt ? `已保存 ${lastSavedAt}` : (saving ? '保存中…' : '未保存')}
          </Text>
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => saveRef.current()} style={styles.headerBtn} disabled={loading}>
            <Text style={styles.saveText}>{loading ? '…' : '保存'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.headerBtn}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      ),
    })
  }, [title, lastSavedAt, saving, loading])

  useFocusEffect(
    useCallback(() => {
      fetchTags(token)
      loadNote()
      setHeaderButtons()
      return () => {
        if (draftTimer.current) clearTimeout(draftTimer.current)
      }
    }, [id]),
  )

  useEffect(() => {
    setHeaderButtons()
  }, [title, lastSavedAt, saving, loading, setHeaderButtons])

  useEffect(() => {
    // 5 秒静默后存草稿
    if (draftTimer.current) clearTimeout(draftTimer.current)
    if (!title && !content) return
    draftTimer.current = setTimeout(async () => {
      try {
        await AsyncStorage.setItem(draftKey(userId, id), JSON.stringify({ title, content, savedAt: Date.now() }))
      } catch {}
    }, 2000)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [title, content, id, userId])

  async function loadNote() {
    if (!id) return
    try {
      const { note } = await api.notes.get(token, id)
      setTitle(note.title)
      setContent(note.content)
      setPinned(note.pinned)
      setSelectedTagIds(note.tags?.map((t) => t.id) || [])
    } catch (e: any) {
      toast.error('加载失败：' + e.message)
    }
  }

  async function save() {
    if (loading || saving) return
    setSaving(true)
    try {
      const body = { title, content, pinned, tagIds: selectedTagIds }
      if (id) {
        await updateNote(token, id, body)
      } else {
        await createNote(token, body)
      }
      // 保存成功，清掉草稿
      try { await AsyncStorage.removeItem(draftKey(userId, id)) } catch {}
      const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      setLastSavedAt(now)
      toast.success('已保存')
    } catch (e: any) {
      toast.error('保存失败：' + e.message)
    } finally {
      setSaving(false)
    }
  }
  saveRef.current = save

  async function onDelete() {
    setShowMenu(false)
    const ok = await confirm({
      title: '删除笔记',
      message: '移入回收站？30 天内可在回收站恢复',
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    try {
      await removeNote(token, id!)
      try { await AsyncStorage.removeItem(draftKey(userId, id)) } catch {}
      toast.success('已移入回收站')
      navigation.goBack()
    } catch (e: any) {
      toast.error('删除失败：' + e.message)
    }
  }

  async function onDuplicate() {
    setShowMenu(false)
    try {
      await createNote(token, { title: title + ' (副本)', content, pinned: false, tagIds: selectedTagIds })
      toast.success('已复制为新笔记')
    } catch (e: any) {
      toast.error('复制失败：' + e.message)
    }
  }

  function onCopyContent() {
    setShowMenu(false)
    const full = `# ${title}\n\n${content}`
    try {
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        // @ts-ignore
        navigator.clipboard.writeText(full)
        toast.success('笔记内容已复制到剪贴板')
      } else {
        toast.info('当前平台不支持复制，请手动选择文本')
      }
    } catch (e: any) {
      toast.error('复制失败：' + e.message)
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    )
  }

  const wordCount = countWords(content)
  const charCount = countChars(content)

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setPinned((p) => !p)} style={styles.toolBtn}>
          <Text style={[styles.pinEmoji, pinned && styles.pinActive]}>{pinned ? '★' : '☆'}</Text>
          <Text style={styles.toolLabel}>{pinned ? '已收藏' : '收藏'}</Text>
        </TouchableOpacity>
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'edit' && styles.modeBtnActive]}
            onPress={() => setMode('edit')}
          >
            <Text style={[styles.modeText, mode === 'edit' && styles.modeTextActive]}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'preview' && styles.modeBtnActive]}
            onPress={() => setMode('preview')}
          >
            <Text style={[styles.modeText, mode === 'preview' && styles.modeTextActive]}>预览</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setShowTagSheet(true)} style={styles.toolBtn}>
          <Text style={styles.pinEmoji}>🏷</Text>
          <Text style={styles.toolLabel}>{selectedTagIds.length || '标签'}</Text>
        </TouchableOpacity>
      </View>

      {mode === 'preview' ? (
        <ScrollView style={styles.preview} contentContainerStyle={styles.previewContent}>
          {title ? <Text style={styles.previewTitle}>{title}</Text> : null}
          <Markdown content={content} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.editor} contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.title}
            placeholder="标题"
            placeholderTextColor={theme.textLight}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
          <TextInput
            style={styles.content}
            placeholder="在这里记录你的想法...支持 Markdown 语法"
            placeholderTextColor={theme.textLight}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      )}

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{wordCount} 字 · {charCount} 字符</Text>
        <Text style={styles.statusText}>{selectedTagIds.length} 标签</Text>
      </View>

      {/* 更多菜单 */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.actionItem} onPress={() => { setShowMenu(false); save() }}>
              <Text style={styles.actionEmoji}>💾</Text>
              <Text style={styles.actionText}>保存笔记</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={onDuplicate}>
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionText}>复制为新笔记</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={onCopyContent}>
              <Text style={styles.actionEmoji}>✂️</Text>
              <Text style={styles.actionText}>复制正文到剪贴板</Text>
            </TouchableOpacity>
            {id ? (
              <TouchableOpacity style={[styles.actionItem, styles.actionDanger]} onPress={onDelete}>
                <Text style={styles.actionEmoji}>🗑</Text>
                <Text style={[styles.actionText, { color: theme.danger }]}>删除（移入回收站）</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* 标签选择 sheet */}
      <Modal visible={showTagSheet} transparent animationType="slide" onRequestClose={() => setShowTagSheet(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTagSheet(false)}>
          <Pressable style={styles.tagSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>选择标签</Text>
              <Text style={styles.sheetHint}>点击勾选 / 取消</Text>
            </View>
            <View style={styles.tagsList}>
              {tags.map((t) => {
                const selected = selectedTagIds.includes(t.id)
                return (
                  <TouchableOpacity key={t.id} onPress={() => toggleTag(t.id)}>
                    <TagChip name={t.name} color={t.color} selected={selected} />
                  </TouchableOpacity>
                )
              })}
              {tags.length === 0 && <Text style={styles.emptyTags}>还没有标签，可在「我的 → 标签管理」添加</Text>}
            </View>
            <View style={styles.addTagRow}>
              <TextInput
                style={styles.addTagInput}
                placeholder="新标签名"
                placeholderTextColor={theme.textLight}
                value={newTag}
                onChangeText={setNewTag}
              />
              <TouchableOpacity
                style={styles.addTagBtn}
                onPress={async () => {
                  const name = newTag.trim()
                  if (!name) return
                  try {
                    const { tag } = await api.tags.create(token, { name })
                    await fetchTags(token)
                    setSelectedTagIds((p) => [...p, tag.id])
                    setNewTag('')
                    toast.success('已添加标签：' + name)
                  } catch (e: any) {
                    toast.error('添加失败：' + e.message)
                  }
                }}
              >
                <Text style={styles.addTagBtnText}>添加</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.card },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  saveText: { color: theme.primary, fontSize: 16, fontWeight: '700' },
  menuIcon: { color: theme.text, fontSize: 22, fontWeight: '700', marginTop: -6 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.bgSoft,
  },
  toolBtn: { alignItems: 'center', gap: 2, padding: 4, minWidth: 56 },
  pinEmoji: { fontSize: 20, color: theme.textLight },
  pinActive: { color: theme.warning },
  toolLabel: { fontSize: 11, color: theme.textMuted },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.bg,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  modeBtnActive: { backgroundColor: theme.primary },
  modeText: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  modeTextActive: { color: '#fff', fontWeight: '700' },
  editor: { flex: 1, backgroundColor: theme.card },
  editorContent: { padding: 20, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 16 },
  content: { fontSize: 16, lineHeight: 26, color: theme.text, minHeight: 240 },
  preview: { flex: 1, backgroundColor: theme.card },
  previewContent: { padding: 20, paddingBottom: 80 },
  previewTitle: { fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 16 },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.bgSoft,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  statusText: { fontSize: 11, color: theme.textLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 9998, elevation: 9998 },
  actionSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    paddingBottom: 32,
    zIndex: 9999,
    elevation: 9999,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  actionDanger: { borderBottomWidth: 0 },
  actionEmoji: { fontSize: 18 },
  actionText: { flex: 1, fontSize: 15, color: theme.text },
  tagSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '70%',
    zIndex: 9999,
    elevation: 9999,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  sheetHint: { fontSize: 12, color: theme.textLight },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emptyTags: { color: theme.textLight, fontSize: 13, paddingVertical: 20, textAlign: 'center', width: '100%' },
  addTagRow: { flexDirection: 'row', gap: 10 },
  addTagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.bg,
  },
  addTagBtn: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: { color: '#fff', fontWeight: '700' },
})
