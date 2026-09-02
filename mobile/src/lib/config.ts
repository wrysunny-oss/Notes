import Constants from 'expo-constants'

export const API_BASE_URL =
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:3000/api'

export const TOKEN_KEY = '@clound_note/token'
export const USER_KEY = '@clound_note/user'

/** 软件全局配置 —— 改名/改 slogan/改简介只需改这里一处 */
export const APP_CONFIG = {
  /** 软件名称 */
  name: '富商笔记',
  /** 登录页副标题 */
  tagline: '记录每一刻灵感 · 随时随地同步',
  /** 注册页 slogan */
  slogan: '开启你的富商笔记之旅',
  /** 关于页简介 */
  description: '富商笔记，记录每一刻灵感，随时随地同步你的笔记。',
  /** 软件版本号 */
  version: '1.0.0',
  /** 演示账号 */
  demoAccount: 'demo@clound.note',
  /** 演示密码 */
  demoPassword: '123456',
} as const
