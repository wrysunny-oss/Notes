import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../stores/toastStore'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  async function submit() {
    if (!account || !password) return toast.error('请输入账号和密码')
    try {
      await login(account, password)
      toast.success('登录成功')
    } catch (e: any) {
      toast.error('登录失败：' + e.message)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>📒</Text>
          </View>
          <Text style={styles.brand}>幻乐笔记</Text>
          <Text style={styles.slogan}>记录每一刻灵感 · 随时随地同步</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>邮箱或用户名</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.textLight}
              value={account}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setAccount}
            />
          </View>

          <Text style={styles.label}>密码</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor={theme.textLight}
              value={password}
              secureTextEntry={!showPwd}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
              <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnText}>{loading ? '登录中…' : '登 录'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
            <Text style={styles.linkHint}>还没有账号？<Text style={styles.linkText}>立即注册 →</Text></Text>
          </TouchableOpacity>

          <View style={styles.demoTip}>
            <Text style={styles.demoTipText}>
              演示账号：demo@clound.note / 123456
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadow.lg,
  },
  logoEmoji: { fontSize: 44 },
  brand: { fontSize: 30, fontWeight: '800', color: theme.text, letterSpacing: 1 },
  slogan: { marginTop: 8, color: theme.textMuted, fontSize: 13 },
  form: {},
  label: { fontSize: 13, color: theme.textMuted, marginBottom: 8, marginTop: 16, fontWeight: '500' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { fontSize: 16, color: theme.textLight, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: theme.text, paddingVertical: 0 },
  eyeBtn: { paddingHorizontal: 6 },
  eyeIcon: { fontSize: 16 },
  btn: {
    backgroundColor: theme.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
    ...theme.shadow.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', paddingVertical: 16 },
  linkHint: { color: theme.textMuted, fontSize: 13 },
  linkText: { color: theme.primary, fontWeight: '600' },
  demoTip: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.primarySoft,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  demoTipText: { color: theme.primaryDark, fontSize: 12 },
})
