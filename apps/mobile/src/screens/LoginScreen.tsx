import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      // AuthContext sets the user → AppNavigator re-renders → tabs appear
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(
        axiosErr?.response?.data?.message ?? 'Invalid email or password'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* ── Logo ── */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🛡️ KAVACH</Text>
          <Text style={styles.logoSub}>Student Portal</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* Error */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Demo hint */}
          <Text style={styles.hint}>
            Demo: student@demo.com / demo123
          </Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Focused learning · Tracked progress · Better habits
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    height: 52,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 16,
  },
  tagline: {
    textAlign: 'center',
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 28,
  },
})
