import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { PRIVACY_POLICY, USER_AGREEMENT } from '../lib/legal'
import { APP_CONFIG } from '../lib/config'
import { theme } from '../theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>

export default function LegalScreen({ route }: Props) {
  const type = route.params?.type ?? 'privacy'
  const isPrivacy = type === 'privacy'
  const sections = isPrivacy ? PRIVACY_POLICY : USER_AGREEMENT

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 18, paddingBottom: 50 }}>
      <Text style={styles.docTitle}>{isPrivacy ? '隐私政策' : '用户协议'}</Text>
      <Text style={styles.docMeta}>
        {APP_CONFIG.name} · 更新于{APP_CONFIG.privacyUpdateDate}
      </Text>
      {sections.map((s) => (
        <View key={s.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          {s.paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  docTitle: { fontSize: 22, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 6 },
  docMeta: { fontSize: 12, color: theme.textLight, textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 8 },
  paragraph: {
    fontSize: 14,
    lineHeight: 23,
    color: theme.textMuted,
    marginBottom: 8,
  },
})
