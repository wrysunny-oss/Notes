import { create } from 'zustand'
import { api, type Note, type Tag } from '../lib/api'

interface NotesState {
  items: Note[]
  tags: Tag[]
  loading: boolean
  error: string | null
  listParams: { trashed: boolean; pinnedOnly: boolean; tagId?: string; keyword?: string }
  fetchList: (token: string, params?: Partial<NotesState['listParams']>) => Promise<void>
  fetchTags: (token: string) => Promise<void>
  createTag: (token: string, name: string) => Promise<void>
  createNote: (token: string, body: Partial<Note> & { tagIds?: string[] }) => Promise<Note>
  updateNote: (token: string, id: string, body: Partial<Note> & { tagIds?: string[] }) => Promise<Note>
  removeNote: (token: string, id: string) => Promise<string>
  restoreNote: (token: string, id: string) => Promise<Note>
  emptyTrash: (token: string) => Promise<number>
  clearError: () => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [],
  tags: [],
  loading: false,
  error: null,
  listParams: { trashed: false, pinnedOnly: false },

  fetchList: async (token, params) => {
    set({ loading: true, error: null })
    const nextParams = {
      trashed: params?.trashed ?? false,
      pinnedOnly: params?.pinnedOnly ?? false,
      tagId: params?.tagId,
      keyword: params?.keyword,
    }
    set({ listParams: nextParams })
    try {
      const { items, total } = await api.notes.list(token, {
        trashed: String(nextParams.trashed),
        pinnedOnly: String(nextParams.pinnedOnly),
        tagId: nextParams.tagId,
        keyword: nextParams.keyword,
      })
      set({ items, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  fetchTags: async (token) => {
    try {
      const { tags } = await api.tags.list(token)
      set({ tags })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  createTag: async (token, name) => {
    try {
      await api.tags.create(token, { name })
      await get().fetchTags(token)
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  createNote: async (token, body) => {
    const { note } = await api.notes.create(token, body)
    set({ items: [note, ...get().items] })
    return note
  },

  updateNote: async (token, id, body) => {
    const { note } = await api.notes.update(token, id, body)
    set({
      items: get().items.map((n) => (n.id === id ? note : n)),
    })
    return note
  },

  removeNote: async (token, id) => {
    const { message } = await api.notes.remove(token, id)
    const inTrash = get().listParams.trashed
    set({
      items: inTrash
        ? get().items.filter((n) => n.id !== id)
        : get().items.map((n) =>
            n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n,
          ),
    })
    return message
  },

  restoreNote: async (token, id) => {
    const { note } = await api.notes.restore(token, id)
    set({ items: get().items.filter((n) => n.id !== id) })
    return note
  },

  emptyTrash: async (token) => {
    const { count } = await api.notes.emptyTrash(token)
    set({ items: [] })
    return count
  },

  clearError: () => set({ error: null }),
}))
