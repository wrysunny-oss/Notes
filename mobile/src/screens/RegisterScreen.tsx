import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import { toast } from '../stores/toastStore'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { theme } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register)
  const loading = useAuthStore((s) => s.loading)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  function strength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '', color: theme.border }
    if (pwd.length < 6) return { score: 1, label: '太短', color: theme.danger }
    let s = 1
    if (/[A-Z]/.test(pwd)) s++
    if (/\d/.test(pwd)) s++
    if (/[^a-zA-Z0-9]/.test(pwd)) s++
    if (pwd.length >= 10) s++
    const map = [
      { label: '弱', color: theme.danger },
      { label: '一般', color: theme.warning },
      { label: '良好', color: theme.info },
      { label: '强', color: theme.success },
      { label: '极强', color: theme.success },
    ]
    return { score: s, ...map[s - 1] }
  }

  const pwdScore = strength(password)

  async function submit() {
    if (!email || !username || !password) return toast.error('请填写必填项')
    if (password.length < 6) return toast.error('密码至少 6 位')
    if (password !== confirm) return toast.error('两次密码不一致')
    try {
      await register({ email, username, password, nickname: nickname || undefined })
      toast.success('注册成功，已自动登录')
    } catch (e: any) {
      toast.error('注册失败：' + e.message)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>✏️</Text>
          </View>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.slogan}>开启你的幻乐笔记之旅</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>邮箱 *</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.textLight}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />

          <Text style={styles.label}>用户名 *</Text>
          <TextInput
            style={styles.input}
            placeholder="2-24 字符"
            placeholderTextColor={theme.textLight}
            value={username}
            autoCapitalize="none"
            onChangeText={setUsername}
          />

          <Text style={styles.label}>昵称</Text>
          <TextInput
            style={styles.input}
            placeholder="选填，默认用用户名"
            placeholderTextColor={theme.textLight}
            value={nickname}
            onChangeText={setNickname}
          />

          <Text style={styles.label}>密码 *</Text>
          <TextInput
            style={styles.input}
            placeholder="至少 6 位"
            placeholderTextColor={theme.textLight}
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          {pwdScore.label ? (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: `${(pwdScore.score / 5) * 100}%`, backgroundColor: pwdScore.color }]} />
              </View>
              <Text style={[styles.strengthText, { color: pwdScore.color }]}>{pwdScore.label}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>确认密码</Text>
          <TextInput
            style={styles.input}
            placeholder="再输入一次"
            placeholderTextColor={theme.textLight}
            value={confirm}
            secureTextEntry
            onChangeText={setConfirm}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnText}>{loading ? '提交中…' : '注 册'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkHint}>已有账号？<Text style={styles.linkText}>去登录 →</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 40 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.shadow.md,
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '700', color: theme.text },
  slogan: { marginTop: 4, color: theme.textMuted, fontSize: 13 },
  form: {},
  label: { fontSize: 13, color: theme.textMuted, marginBottom: 8, marginTop: 14, fontWeight: '500' },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: theme.text,
  },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  strengthBar: { flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12, fontWeight: '600' },
  btn: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    ...theme.shadow.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  linkBtn: { alignItems: 'center', paddingVertical: 14 },
  linkHint: { color: theme.textMuted, fontSize: 13 },
  linkText: { color: theme.accent, fontWeight: '600' },
})
