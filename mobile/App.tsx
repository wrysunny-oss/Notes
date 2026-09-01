import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuthStore } from './src/stores/authStore'
import AppNavigator from './src/navigation/AppNavigator'
import ToastContainer from './src/components/Toast'
import ConfirmDialog from './src/components/ConfirmDialog'
import { theme } from './src/theme'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init().finally(() => setReady(true))
  }, [init])

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
        <ToastContainer />
        <ConfirmDialog />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
})
