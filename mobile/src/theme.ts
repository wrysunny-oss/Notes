export const palette = {
  // 主色 - 蓝紫渐变感
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  primarySoft: '#eef2ff',

  // 辅助色
  accent: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',

  // 中性
  bg: '#f5f5f9',
  bgSoft: '#fafafe',
  card: '#ffffff',
  border: '#e7e7ef',
  borderStrong: '#d4d4e0',

  // 文字
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  textInverse: '#ffffff',

  // 标签色板
  tagColors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ef4444'],
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
}

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
}

export const shadow = {
  sm: { shadowColor: '#1e293b', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#1e293b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 },
}

export const theme = {
  ...palette,
  spacing,
  radius,
  shadow,
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.floor((Date.now() - then) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return new Date(iso).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export function initials(name?: string | null, email?: string | null): string {
  const src = (name || '').trim() || (email || '').trim()
  if (!src) return '?'
  const ch = src.charAt(0).toUpperCase()
  return ch
}

export function colorFromString(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0
  return palette.tagColors[Math.abs(hash) % palette.tagColors.length]
}

export function countChars(s: string): number {
  return Array.from(s).length
}

export function countWords(s: string): number {
  const t = s.trim()
  if (!t) return 0
  // 中文按字数 + 英文按空格分词
  const cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length
  const en = (t.replace(/[\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(Boolean)).length
  return cjk + en
}
