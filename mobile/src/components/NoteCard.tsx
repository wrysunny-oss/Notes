import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Note } from '../lib/api'
import { theme, timeAgo } from '../theme'

interface Props {
  note: Note
  showActions?: boolean
}

function escapePreview(s: string): string {
  return s
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*`_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export default function NoteCard({ note, showActions = false }: Props) {
  const preview = escapePreview(note.content).slice(0, 80)
  const hasTags = note.tags && note.tags.length > 0
  return (
    <View style={[styles.card, note.pinned && styles.cardPinned]}>
      <View style={styles.header}>
        {note.pinned && <Text style={styles.pin}>★</Text>}
        <Text style={styles.title} numberOfLines={1}>
          {note.title || '无标题'}
        </Text>
      </View>

      {preview ? (
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>
      ) : (
        <Text style={styles.previewEmpty}>空笔记</Text>
      )}

      <View style={styles.footer}>
        <View style={styles.tags}>
          {hasTags && note.tags!.slice(0, 3).map((t) => (
            <View
              key={t.id}
              style={[styles.tagChip, { backgroundColor: (t.color || theme.primary) + '22' }]}
            >
              <Text style={[styles.tagText, { color: t.color || theme.primary }]}>
                {t.name}
              </Text>
            </View>
          ))}
          {hasTags && note.tags!.length > 3 && (
            <Text style={styles.tagMore}>+{note.tags!.length - 3}</Text>
          )}
        </View>
        <Text style={styles.time}>{timeAgo(note.updatedAt)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.shadow.sm,
  },
  cardPinned: {
    borderColor: theme.warning + '55',
    backgroundColor: '#fffbeb',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pin: { color: theme.warning, fontSize: 16 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.text, letterSpacing: 0.2 },
  preview: { marginTop: 6, color: theme.textMuted, fontSize: 13, lineHeight: 20 },
  previewEmpty: { marginTop: 6, color: theme.textLight, fontSize: 13, fontStyle: 'italic' },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: { flexDirection: 'row', flex: 1, gap: 6, flexWrap: 'wrap' },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  tagMore: { fontSize: 11, color: theme.textLight, alignSelf: 'center' },
  time: { color: theme.textLight, fontSize: 11 },
})
