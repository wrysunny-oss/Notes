import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuthStore } from '../stores/authStore'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { useNotesStore } from '../stores/noteStore'
import { api } from '../lib/api'
import TagChip from '../components/TagChip'
import { toast } from '../stores/toastStore'
import { confirm } from '../stores/confirmStore'
import { theme, initials, colorFromString } from '../theme'
import { APP_CONFIG } from '../lib/config'

export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user, logout, updateProfile, deactivate } = useAuthStore()
  const token = useAuthStore((s) => s.token)!
  const { tags, fetchTags, createTag, updateNote } = useNotesStore() // updateNote 占位避免警告
  void updateNote
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [newTag, setNewTag] = useState('')
  const [tagColor, setTagColor] = useState(theme.tagColors[0])
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null)
  const [deactivateVisible, setDeactivateVisible] = useState(false)
  const [deactivatePwd, setDeactivatePwd] = useState('')
  const [deactivating, setDeactivating] = useState(false)

  useEffect(() => {
    fetchTags(token)
  }, [token])

  async function saveProfile() {
    if (!nickname.trim()) return toast.error('昵称不能为空')
    try {
      await updateProfile({ nickname: nickname.trim() })
      toast.success('资料已更新')
    } catch (e: any) {
      toast.error('更新失败：' + e.message)
    }
  }

  async function addTag() {
    const name = newTag.trim()
    if (!name) return
    try {
      await createTag(token, name)
      setNewTag('')
      toast.success('已添加标签：' + name)
    } catch (e: any) {
      toast.error('添加失败：' + e.message)
    }
  }

  async function saveTagEdit() {
    if (!editingTag) return
    try {
      await api.tags.update(token, editingTag.id, { name: editingTag.name, color: editingTag.color })
      await fetchTags(token)
      setEditingTag(null)
      toast.success('标签已更新')
    } catch (e: any) {
      toast.error('保存失败：' + e.message)
    }
  }

  async function deleteTag(id: string, name: string) {
    const ok = await confirm({
      title: '删除标签',
      message: `确定删除「${name}」？该标签会从所有笔记中移除`,
      confirmText: '删除',
      danger: true,
    })
    if (!ok) return
    try {
      await api.tags.remove(token, id)
      await fetchTags(token)
      toast.success('已删除标签')
    } catch (e: any) {
      toast.error('删除失败：' + e.message)
    }
  }

  async function changePassword() {
    if (!oldPwd || !newPwd) return toast.error('请填写原密码和新密码')
    if (newPwd.length < 6) return toast.error('新密码至少 6 位')
    if (newPwd !== confirmPwd) return toast.error('两次密码不一致')
    try {
      const res = await api.auth.updatePassword(token, { oldPassword: oldPwd, newPassword: newPwd })
      toast.success(res.message)
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (e: any) {
      toast.error('修改失败：' + e.message)
    }
  }

  async function onLogout() {
    const ok = await confirm({
      title: '退出登录',
      message: '确定要退出当前账号吗？',
      confirmText: '退出',
      danger: true,
    })
    if (ok) logout()
  }

  async function onDeactivate() {
    if (!deactivatePwd) return toast.error('请输入登录密码以确认注销')
    const ok = await confirm({
      title: '最后确认',
      message: '账号注销后不可恢复，全部笔记与标签将被永久删除。确定继续吗？',
      confirmText: '确认注销',
      danger: true,
    })
    if (!ok) return
    setDeactivating(true)
    try {
      const msg = await deactivate(deactivatePwd)
      setDeactivateVisible(false)
      setDeactivatePwd('')
      toast.success(msg || '账号已注销')
    } catch (e: any) {
      toast.error('注销失败：' + e.message)
    } finally {
      setDeactivating(false)
    }
  }

  const userInitial = initials(user?.nickname, user?.email)
  const avatarColor = colorFromString(user?.username || user?.email || 'X')

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      {/* 用户卡片 */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{user?.nickname || user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* 资料修改 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>个人资料</Text>
        </View>
        <Text style={styles.label}>昵称</Text>
        <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="设置昵称" placeholderTextColor={theme.textLight} />
        <TouchableOpacity style={styles.btn} onPress={saveProfile}>
          <Text style={styles.btnText}>保存</Text>
        </TouchableOpacity>
      </View>

      {/* 标签管理 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>标签管理</Text>
          <Text style={styles.sectionHint}>{tags.length} 个</Text>
        </View>
        <View style={styles.tagsGrid}>
          {tags.map((t) => (
            <TouchableOpacity
              key={t.id}
              onLongPress={() => setEditingTag({ id: t.id, name: t.name, color: t.color || theme.primary })}
              onPress={() => setEditingTag({ id: t.id, name: t.name, color: t.color || theme.primary })}
            >
              <TagChip name={t.name} color={t.color} />
            </TouchableOpacity>
          ))}
          {tags.length === 0 && <Text style={styles.empty}>还没有标签，添加一个吧</Text>}
        </View>
        <View style={styles.tagCreator}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="新标签名"
            placeholderTextColor={theme.textLight}
            value={newTag}
            onChangeText={setNewTag}
          />
          <TouchableOpacity style={[styles.colorDot, { backgroundColor: tagColor }]} onPress={() => {
            const idx = theme.tagColors.indexOf(tagColor)
            setTagColor(theme.tagColors[(idx + 1) % theme.tagColors.length])
          }} />
          <TouchableOpacity style={[styles.btn, { marginLeft: 0, marginTop: 0, paddingHorizontal: 16, paddingVertical: 12, alignSelf: 'center' }]} onPress={addTag}>
            <Text style={styles.btnText}>添加</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.tip}>提示：点击颜色块切换标签颜色 · 点击标签可重命名/删除</Text>
      </View>

      {/* 修改密码 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>修改密码</Text>
        </View>
        <TextInput style={[styles.input, { marginBottom: 10 }]} placeholder="原密码" secureTextEntry value={oldPwd} onChangeText={setOldPwd} placeholderTextColor={theme.textLight} />
        <TextInput style={[styles.input, { marginBottom: 10 }]} placeholder="新密码（至少 6 位）" secureTextEntry value={newPwd} onChangeText={setNewPwd} placeholderTextColor={theme.textLight} />
        <TextInput style={[styles.input, { marginBottom: 10 }]} placeholder="确认新密码" secureTextEntry value={confirmPwd} onChangeText={setConfirmPwd} placeholderTextColor={theme.textLight} />
        <TouchableOpacity style={styles.btn} onPress={changePassword}>
          <Text style={styles.btnText}>修改密码</Text>
        </TouchableOpacity>
      </View>

      {/* 法律与隐私 —— 常驻入口（主页 → 我的 → 协议，仅 2 步触达） */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>法律与隐私</Text>
        </View>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Legal', { type: 'agreement' })}
        >
          <Text style={styles.linkRowText}>📄 用户协议</Text>
          <Text style={styles.linkRowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
        >
          <Text style={styles.linkRowText}>🔒 隐私政策</Text>
          <Text style={styles.linkRowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>版本</Text>
          <Text style={styles.aboutValue}>{APP_CONFIG.version}</Text>
        </View>
        <View style={[styles.aboutRow, { alignItems: 'flex-start' }]}>
          <Text style={styles.aboutLabel}>简介</Text>
          <Text style={[styles.aboutValue, { flexShrink: 1, flexWrap: 'wrap', maxWidth: '70%' }]}>{APP_CONFIG.description}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deactivateBtn} onPress={() => setDeactivateVisible(true)}>
        <Text style={styles.deactivateText}>注销账号</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      {/* 注销账号密码确认 Modal */}
      <Modal visible={deactivateVisible} transparent animationType="fade" onRequestClose={() => setDeactivateVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDeactivateVisible(false)}>
          <Pressable style={styles.editSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>注销账号</Text>
            <Text style={styles.deactivateWarn}>
              注销后账号将无法登录，账号下全部笔记、标签等数据将被永久删除且无法恢复。请输入登录密码以确认：
            </Text>
            <TextInput
              style={styles.input}
              placeholder="登录密码"
              placeholderTextColor={theme.textLight}
              secureTextEntry
              value={deactivatePwd}
              onChangeText={setDeactivatePwd}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, { backgroundColor: theme.border }]}
                onPress={() => {
                  setDeactivateVisible(false)
                  setDeactivatePwd('')
                }}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: theme.danger }]} onPress={onDeactivate} disabled={deactivating}>
                <Text style={styles.btnText}>{deactivating ? '注销中…' : '确认注销'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 编辑标签 Modal */}
      <Modal visible={!!editingTag} transparent animationType="fade" onRequestClose={() => setEditingTag(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingTag(null)}>
          <Pressable style={styles.editSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>编辑标签</Text>
            <Text style={styles.label}>名称</Text>
            <TextInput
              style={styles.input}
              value={editingTag?.name}
              onChangeText={(v) => setEditingTag((p) => (p ? { ...p, name: v } : p))}
              placeholder="标签名"
              placeholderTextColor={theme.textLight}
            />
            <Text style={styles.label}>颜色</Text>
            <View style={styles.colorPicker}>
              {theme.tagColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c, borderColor: editingTag?.color === c ? '#0f172a' : 'transparent' }]}
                  onPress={() => setEditingTag((p) => (p ? { ...p, color: c } : p))}
                />
              ))}
            </View>
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, { backgroundColor: theme.danger }]}
                onPress={async () => {
                  if (!editingTag) return
                  const tagData = editingTag
                  setEditingTag(null)
                  await deleteTag(tagData.id, tagData.name)
                }}
              >
                <Text style={styles.btnText}>删除</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sheetBtn, { flex: 1 }]} onPress={saveTagEdit}>
                <Text style={styles.btnText}>保存</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  profileCard: {
    backgroundColor: theme.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    ...theme.shadow.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  profileInfo: { flex: 1 },
  nickname: { color: '#fff', fontSize: 18, fontWeight: '700' },
  email: { color: '#e0e7ff', fontSize: 13, marginTop: 4 },
  section: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  sectionHint: { fontSize: 12, color: theme.textLight },
  label: { fontSize: 12, color: theme.textMuted, marginBottom: 6, marginTop: 8, fontWeight: '500' },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: theme.text,
  },
  btn: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    ...theme.shadow.sm,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  empty: { color: theme.textLight, fontSize: 13, paddingVertical: 12 },
  tagCreator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  tip: { fontSize: 11, color: theme.textLight, marginTop: 10, lineHeight: 16 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
  aboutLabel: { color: theme.textMuted, fontSize: 14 },
  aboutValue: { color: theme.text, fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.danger + '44',
    marginTop: 4,
  },
  logoutText: { color: theme.danger, fontWeight: '700', fontSize: 15 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  linkRowText: { fontSize: 14, color: theme.text, fontWeight: '500' },
  linkRowArrow: { fontSize: 20, color: theme.textLight },
  deactivateBtn: {
    backgroundColor: theme.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.danger,
    marginTop: 4,
  },
  deactivateText: { color: theme.danger, fontWeight: '700', fontSize: 15 },
  deactivateWarn: { fontSize: 13, lineHeight: 20, color: theme.textMuted, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24, zIndex: 9998, elevation: 9998 },
  editSheet: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12, textAlign: 'center' },
  colorPicker: { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 10 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  sheetBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
})
