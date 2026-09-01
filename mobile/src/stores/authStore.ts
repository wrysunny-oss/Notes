import { create } from 'zustand'
import { api, type User } from '../lib/api'
import { loadStoredAuth, saveAuth, clearAuth } from '../lib/storage'

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  init: () => Promise<void>
  login: (account: string, password: string) => Promise<void>
  register: (body: { email: string; username: string; password: string; nickname?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (body: { nickname?: string; avatar?: string }) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  loading: false,
  error: null,

  init: async () => {
    const { token, user } = await loadStoredAuth()
    set({ token, user })
    if (token) {
      try {
        const { user: fresh } = await api.auth.me(token)
        set({ user: fresh })
      } catch {
        await clearAuth()
        set({ token: null, user: null })
      }
    }
  },

  login: async (account, password) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await api.auth.login({ account, password })
      await saveAuth(token, user)
      set({ token, user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.message || '登录失败' })
      throw e
    }
  },

  register: async (body) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await api.auth.register(body)
      await saveAuth(token, user)
      set({ token, user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e.message || '注册失败' })
      throw e
    }
  },

  logout: async () => {
    await clearAuth()
    set({ token: null, user: null })
  },

  refreshUser: async () => {
    const token = get().token
    if (!token) return
    const { user } = await api.auth.me(token)
    set({ user })
  },

  updateProfile: async (body) => {
    const token = get().token
    if (!token) throw new Error('未登录')
    const { user } = await api.auth.updateProfile(token, body)
    await saveAuth(token, user)
    set({ user })
  },

  clearError: () => set({ error: null }),
}))
