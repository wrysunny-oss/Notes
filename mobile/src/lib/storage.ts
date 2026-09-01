import AsyncStorage from '@react-native-async-storage/async-storage'
import { TOKEN_KEY, USER_KEY } from './config'

export async function loadStoredAuth(): Promise<{ token: string | null; user: any | null }> {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ])
  let user: any = null
  if (userJson) {
    try {
      user = JSON.parse(userJson)
    } catch {
      user = null
    }
  }
  return { token, user }
}

export async function saveAuth(token: string, user: any): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ])
}

export async function clearAuth(): Promise<void> {
  await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)])
}
