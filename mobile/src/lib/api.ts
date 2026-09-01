import { API_BASE_URL } from './config'

export interface ApiError extends Error {
  status?: number
  code?: string
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  query?: Record<string, string | string[] | undefined>
  token?: string | null
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return `${API_BASE_URL}${path}`
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return params ? `${API_BASE_URL}${path}?${params}` : `${API_BASE_URL}${path}`
}

export async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  let data: any = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!res.ok) {
    const err = new Error(data?.message || `请求失败 (${res.status})`) as ApiError
    err.status = res.status
    err.code = data?.code
    throw err
  }

  return data as T
}

export const api = {
  auth: {
    register: (body: { email: string; username: string; password: string; nickname?: string }) =>
      request<{ token: string; user: User }>('/auth/register', { method: 'POST', body }),
    login: (body: { account: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', { method: 'POST', body }),
    me: (token: string) => request<{ user: User }>('/auth/me', { token }),
    updateProfile: (token: string, body: { nickname?: string; avatar?: string }) =>
      request<{ user: User }>('/auth/profile', { method: 'PUT', token, body }),
    updatePassword: (token: string, body: { oldPassword: string; newPassword: string }) =>
      request<{ message: string }>('/auth/password', { method: 'PUT', token, body }),
  },
  notes: {
    list: (token: string, params: Record<string, any> = {}) =>
      request<{ items: Note[]; total: number }>('/notes', { token, query: params }),
    get: (token: string, id: string) => request<{ note: Note }>(`/notes/${id}`, { token }),
    create: (token: string, body: Partial<Note> & { tagIds?: string[] }) =>
      request<{ note: Note }>('/notes', { method: 'POST', token, body }),
    update: (token: string, id: string, body: Partial<Note> & { tagIds?: string[] }) =>
      request<{ note: Note }>(`/notes/${id}`, { method: 'PUT', token, body }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/notes/${id}`, { method: 'DELETE', token }),
    restore: (token: string, id: string) =>
      request<{ note: Note; message: string }>(`/notes/${id}/restore`, { method: 'POST', token }),
    emptyTrash: (token: string) =>
      request<{ message: string; count: number }>('/notes/trash/empty', { method: 'DELETE', token }),
  },
  tags: {
    list: (token: string) => request<{ tags: Tag[] }>('/tags', { token }),
    create: (token: string, body: { name: string; color?: string }) =>
      request<{ tag: Tag }>('/tags', { method: 'POST', token, body }),
    update: (token: string, id: string, body: { name?: string; color?: string }) =>
      request<{ tag: Tag }>(`/tags/${id}`, { method: 'PUT', token, body }),
    remove: (token: string, id: string) =>
      request<{ message: string }>(`/tags/${id}`, { method: 'DELETE', token }),
  },
}

export interface User {
  id: string
  email: string
  username: string
  nickname?: string | null
  avatar?: string | null
  createdAt?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  _count?: { notes: number }
}

export interface Note {
  id: string
  title: string
  content: string
  userId: string
  pinned: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  tags?: Tag[]
}
