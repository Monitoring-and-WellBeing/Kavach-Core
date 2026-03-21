import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../lib/axios'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  topic?: string
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ item }: { item: Message }) {
  const isUser = item.role === 'user'
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && (
        <Text style={styles.aiLabel}>🤖 Study Buddy</Text>
      )}
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
        {item.content}
      </Text>
      {item.topic && !isUser && (
        <Text style={styles.topicTag}>📚 {item.topic}</Text>
      )}
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function StudyBuddyScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi! I'm your Study Buddy! 🔬📐\n\nAsk me any Math or Science question and I'll help you understand it step by step.\n\nWhat are you working on today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState(10)
  const [limitReached, setLimitReached] = useState(false)
  const listRef = useRef<FlatList>(null)

  // Fetch remaining count on mount
  useEffect(() => {
    api
      .get('/ai/study-buddy/usage')
      .then((res) => {
        setRemaining(res.data.remaining)
        setLimitReached(res.data.limitReached)
      })
      .catch(() => {})
  }, [])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading || limitReached) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/study-buddy/chat', {
        message: trimmed,
      })

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        topic: data.topic,
      }

      setMessages((prev) => [...prev, aiMsg])
      setRemaining(data.remainingQuestions)
      setLimitReached(data.limitReached)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "Oops! I couldn't connect right now. Check your internet and try again! 🔄",
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🔬 Study Buddy</Text>
            <Text style={styles.headerSub}>Math & Science only · CBSE / ICSE</Text>
          </View>
          <View style={[
            styles.counterBadge,
            limitReached && styles.counterBadgeDanger,
          ]}>
            <Text style={styles.counterText}>
              {limitReached ? '😴 Come back tomorrow!' : `${remaining} left today`}
            </Text>
          </View>
        </View>

        {/* ── Scope reminder ── */}
        <View style={styles.scopeBar}>
          <Text style={styles.scopeText}>
            📐 Math  ·  🔬 Science  ·  Classes 5–12
          </Text>
        </View>

        {/* ── Messages ── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => <MessageBubble item={item} />}
        />

        {/* ── Typing indicator ── */}
        {loading && (
          <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.typingText}> Thinking...</Text>
          </View>
        )}

        {/* ── Input row ── */}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, limitReached && styles.inputDisabled]}
            placeholder={
              limitReached
                ? 'Come back tomorrow! 🌟'
                : 'Ask a Math or Science question...'
            }
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            editable={!limitReached && !loading}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || loading || limitReached) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!input.trim() || loading || limitReached}
            activeOpacity={0.8}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2563EB' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#BFDBFE', fontSize: 11, marginTop: 2 },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  counterBadgeDanger: { backgroundColor: 'rgba(239,68,68,0.3)' },
  counterText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Scope bar
  scopeBar: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  scopeText: { fontSize: 11, color: '#3B82F6', textAlign: 'center', fontWeight: '500' },

  // Messages
  messageList: { flex: 1 },
  messageContent: { padding: 16, gap: 10, paddingBottom: 8 },

  // Bubbles
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  aiLabel: { fontSize: 10, color: '#94A3B8', marginBottom: 4, fontWeight: '600' },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  userText: { color: '#fff' },
  aiText: { color: '#1E293B' },
  topicTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
  },
  typingText: { fontSize: 13, color: '#64748B', marginLeft: 4 },

  // Input
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputDisabled: { opacity: 0.5 },
  sendBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#2563EB',
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
})
