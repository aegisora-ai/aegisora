import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { colors } from '../src/theme/colors';
import { useAuth } from '../src/store/auth';

export default function SignIn() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Shield color={colors.primary} size={64} style={{ marginBottom: 24 }} />
          <Text style={styles.title}>AEGISORA</Text>
          <Text style={styles.subtitle}>Sign in</Text>
        </View>
        <View style={{ gap: 12 }}>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@company.com" placeholderTextColor={colors.secondary} style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={colors.secondary} style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <Pressable style={styles.button} onPress={handleLogin} disabled={loading || !email || !password}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 32 },
  header: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: colors.secondary, marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.secondary, borderRadius: 12, padding: 14, color: colors.text },
  error: { color: '#ef4444', fontSize: 13 },
  button: { backgroundColor: colors.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});