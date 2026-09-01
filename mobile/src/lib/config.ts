import Constants from 'expo-constants'

export const API_BASE_URL =
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://localhost:3000/api'

export const TOKEN_KEY = '@clound_note/token'
export const USER_KEY = '@clound_note/user'
