import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }
  | { type: 'hr' }

function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  let listBuf: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flush = () => {
    if (listBuf.length && listType) {
      blocks.push({ type: listType, items: listBuf })
      listBuf = []
      listType = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      flush()
      i++
      continue
    }
    if (line.trim() === '---' || line.trim() === '***') {
      flush()
      blocks.push({ type: 'hr' })
      i++
      continue
    }
    const h1 = line.match(/^#\s+(.*)$/)
    if (h1) { flush(); blocks.push({ type: 'h1', text: h1[1] }); i++; continue }
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) { flush(); blocks.push({ type: 'h2', text: h2[1] }); i++; continue }
    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) { flush(); blocks.push({ type: 'h3', text: h3[1] }); i++; continue }
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) { flush(); blocks.push({ type: 'quote', text: quote[1] }); i++; continue }
    const ul = line.match(/^[-*+]\s+(.*)$/)
    if (ul) { listType = 'ul'; listBuf.push(ul[1]); i++; continue }
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) { listType = 'ol'; listBuf.push(ol[1]); i++; continue }
    const codeFence = line.match(/^```/)
    if (codeFence) {
      flush()
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].match(/^```/)) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code', text: buf.join('\n') })
      continue
    }
    flush()
    blocks.push({ type: 'p', text: line })
    i++
  }
  flush()
  return blocks
}

function renderInline(text: string, baseStyle: any, keyPrefix: string) {
  const tokens: React.ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let last = 0
  let m: RegExpExecArray | null
  let idx = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push(<Text key={`${keyPrefix}-t${idx++}`} style={baseStyle}>{text.slice(last, m.index)}</Text>)
    if (m[2]) tokens.push(<Text key={`${keyPrefix}-b${idx++}`} style={[baseStyle, { fontWeight: '700' }]}>{m[2]}</Text>)
    else if (m[3]) tokens.push(<Text key={`${keyPrefix}-i${idx++}`} style={[baseStyle, { fontStyle: 'italic' }]}>{m[3]}</Text>)
    else if (m[4]) tokens.push(<Text key={`${keyPrefix}-c${idx++}`} style={[baseStyle, styles.codeInline]}>{m[4]}</Text>)
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push(<Text key={`${keyPrefix}-t${idx++}`} style={baseStyle}>{text.slice(last)}</Text>)
  return <Text>{tokens}</Text>
}

export default function Markdown({ content, style }: { content: string; style?: any }) {
  const blocks = parse(content || '')
  if (!blocks.length) {
    return <Text style={[styles.p, { color: theme.textLight }]}>还没有内容...</Text>
  }
  return (
    <View style={[styles.wrap, style]}>
      {blocks.map((b, i) => {
        const k = `b${i}`
        switch (b.type) {
          case 'h1':
            return <Text key={k} style={styles.h1}>{b.text}</Text>
          case 'h2':
            return <Text key={k} style={styles.h2}>{b.text}</Text>
          case 'h3':
            return <Text key={k} style={styles.h3}>{b.text}</Text>
          case 'quote':
            return (
              <View key={k} style={styles.quoteBox}>
                <Text style={styles.quote}>{renderInline(b.text, styles.quote, k)}</Text>
              </View>
            )
          case 'code':
            return (
              <View key={k} style={styles.codeBox}>
                <Text style={styles.code}>{b.text}</Text>
              </View>
            )
          case 'ul':
            return (
              <View key={k} style={styles.list}>
                {b.items.map((it, j) => (
                  <View key={`${k}-${j}`} style={styles.li}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.liText}>{renderInline(it, styles.liText, `${k}-${j}`)}</Text>
                  </View>
                ))}
              </View>
            )
          case 'ol':
            return (
              <View key={k} style={styles.list}>
                {b.items.map((it, j) => (
                  <View key={`${k}-${j}`} style={styles.li}>
                    <Text style={styles.bullet}>{j + 1}.</Text>
                    <Text style={styles.liText}>{renderInline(it, styles.liText, `${k}-${j}`)}</Text>
                  </View>
                ))}
              </View>
            )
          case 'hr':
            return <View key={k} style={styles.hr} />
          default:
            return <Text key={k} style={styles.p}>{renderInline(b.text, styles.p, k)}</Text>
        }
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  h1: { fontSize: 24, fontWeight: '700', color: theme.text, marginTop: 8 },
  h2: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 6 },
  h3: { fontSize: 17, fontWeight: '600', color: theme.text, marginTop: 4 },
  p: { fontSize: 15, lineHeight: 24, color: theme.text },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
    paddingLeft: 12,
    paddingVertical: 4,
    backgroundColor: theme.primarySoft,
    borderRadius: 4,
  },
  quote: { fontSize: 14, color: theme.textMuted, lineHeight: 22, fontStyle: 'italic' },
  codeBox: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  code: { fontFamily: 'monospace', fontSize: 13, color: '#e2e8f0', lineHeight: 20 },
  codeInline: { fontFamily: 'monospace', fontSize: 13, backgroundColor: theme.primarySoft, color: theme.primaryDark, paddingHorizontal: 4, borderRadius: 4 },
  list: { gap: 4, paddingLeft: 4 },
  li: { flexDirection: 'row', gap: 8 },
  bullet: { color: theme.primary, fontWeight: '700', fontSize: 15, lineHeight: 22 },
  liText: { flex: 1, fontSize: 15, lineHeight: 22, color: theme.text },
  hr: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
})
