import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  BackHandler,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PRIVACY_POLICY, USER_AGREEMENT, type LegalSection } from '../lib/legal'
import { APP_CONFIG } from '../lib/config'
import { theme } from '../theme'

const CONSENT_KEY = '@clound_note/privacy_consent_v1'

type DocView = null | 'privacy' | 'agreement'

/**
 * 首次启动隐私政策弹窗（应用商店合规要求）
 * - 未同意前不可进入 App
 * - 含明确的“同意 / 拒绝”按钮
 * - 拒绝后二次确认，仍拒绝则退出 App
 */
export default function PrivacyConsent() {
  const [visible, setVisible] = useState(false)
  const [doc, setDoc] = useState<DocView>(null)
  const [confirmReject, setConfirmReject] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY).then((v) => {
      if (v !== 'agreed') setVisible(true)
    })
  }, [])

  async function agree() {
    await AsyncStorage.setItem(CONSENT_KEY, 'agreed')
    setVisible(false)
  }

  function rejectFinal() {
    setConfirmReject(false)
    if (Platform.OS === 'web') {
      setVisible(true)
    } else {
      BackHandler.exitApp()
    }
  }

  function openDoc(d: DocView) {
    setDoc(d)
  }

  if (!visible) return null

  const docData: LegalSection[] | null =
    doc === 'privacy' ? PRIVACY_POLICY : doc === 'agreement' ? USER_AGREEMENT : null

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.mask}>
        {docData ? (
          // 协议全文查看
          <View style={styles.docCard}>
            <Text style={styles.docTitle}>{doc === 'privacy' ? '隐私政策' : '用户协议'}</Text>
            <ScrollView style={styles.docScroll} contentContainerStyle={{ paddingBottom: 10 }}>
              {docData.map((s) => (
                <View key={s.title}>
                  <Text style={styles.docSectionTitle}>{s.title}</Text>
                  {s.paragraphs.map((p, i) => (
                    <Text key={i} style={styles.docParagraph}>
                      {p}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.docBackBtn} onPress={() => setDoc(null)}>
              <Text style={styles.docBackText}>返 回</Text>
            </TouchableOpacity>
          </View>
        ) : confirmReject ? (
          // 拒绝二次确认
          <View style={styles.card}>
            <Text style={styles.title}>温馨提示</Text>
            <Text style={styles.body}>
              若您拒绝《用户协议》和《隐私政策》，{APP_CONFIG.name}将无法为您提供服务。请您认真阅读并充分理解后再做选择。
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => setConfirmReject(false)}>
                <Text style={styles.btnGhostText}>再看看</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={rejectFinal}>
                <Text style={styles.btnWhite}>仍拒绝并退出</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // 主弹窗
          <View style={styles.card}>
            <Text style={styles.title}>服务协议与隐私政策</Text>
            <ScrollView style={styles.introScroll}>
              <Text style={styles.body}>
                欢迎使用{APP_CONFIG.name}！在使用前，请您阅读并同意
                <Text style={styles.link} onPress={() => openDoc('agreement')}>
                  《用户协议》
                </Text>
                和
                <Text style={styles.link} onPress={() => openDoc('privacy')}>
                  《隐私政策》
                </Text>
                。
              </Text>
              <Text style={styles.body}>
                我们将依法收集和处理您的邮箱、用户名、笔记内容及设备日志等信息，用于为您提供笔记记录与多端同步服务。您可以随时在“我的”页面中
                <Text style={styles.bold}>注销账号</Text>
                ，注销后账号及全部笔记数据将被永久删除。
              </Text>
            </ScrollView>
            <View style={styles.btnRow}>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setConfirmReject(true)}>
                <Text style={styles.btnGhostText}>拒绝</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} onPress={agree}>
                <Text style={styles.btnWhite}>同意并继续</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10000,
    elevation: 10000,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 22,
    zIndex: 10001,
    elevation: 10001,
  },
  title: { fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 14 },
  introScroll: { maxHeight: 260, marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 23, color: theme.textMuted, marginBottom: 10 },
  link: { color: theme.primary, fontWeight: '600' },
  bold: { fontWeight: '700', color: theme.text },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: theme.primary },
  btnDanger: { backgroundColor: theme.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.border },
  btnWhite: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnGhostText: { color: theme.textMuted, fontWeight: '700', fontSize: 15 },
  // 协议全文
  docCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 20,
    maxHeight: '85%',
    zIndex: 10001,
    elevation: 10001,
  },
  docTitle: { fontSize: 18, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 14 },
  docScroll: { height: Dimensions.get('window').height * 0.55 },
  docSectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 8, marginBottom: 6 },
  docParagraph: { fontSize: 13, lineHeight: 21, color: theme.textMuted, marginBottom: 6 },
  docBackBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  docBackText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
