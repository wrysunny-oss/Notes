import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, StyleSheet } from 'react-native'
import { useAuthStore } from '../stores/authStore'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import NotesListScreen from '../screens/NotesListScreen'
import NoteEditorScreen from '../screens/NoteEditorScreen'
import TrashScreen from '../screens/TrashScreen'
import SettingsScreen from '../screens/SettingsScreen'
import { theme } from '../theme'

export type RootStackParamList = {
  Main: undefined
  NoteEditor: { id?: string } | undefined
  Login: undefined
  Register: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

const screenOptions: NativeStackNavigationOptions = {
  headerBackTitle: '返回',
  headerTitleStyle: { fontWeight: '700', color: theme.text, fontSize: 17 },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: theme.card },
  headerTintColor: theme.primary,
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textLight,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Notes"
        component={NotesListScreen}
        options={{
          headerTitle: '我的笔记',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: { fontWeight: '700', color: theme.text, fontSize: 17 },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, color: focused ? theme.primary : theme.textLight }}>{focused ? '📓' : '📖'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Trash"
        component={TrashScreen}
        options={{
          headerTitle: '回收站',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: { fontWeight: '700', color: theme.text, fontSize: 17 },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, color: focused ? theme.primary : theme.textLight }}>{focused ? '🗑️' : '🗑'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: '我的',
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.card },
          headerTitleStyle: { fontWeight: '700', color: theme.text, fontSize: 17 },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, color: focused ? theme.primary : theme.textLight }}>{focused ? '⚙️' : '⚙'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const token = useAuthStore((s) => s.token)
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="NoteEditor" component={NoteEditorScreen} options={{ title: '编辑笔记' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: '注册账号' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
