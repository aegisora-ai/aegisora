import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Layers } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.illContainer}>
          <View style={styles.accentCircle} />
          <View style={styles.cardBack}>
            <Layers color="rgba(255,255,255,0.2)" size={32} />
          </View>
          <View style={styles.cardFront}>
            <Shield color="#ffffff" size={40} />
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Secure control for{"\n"}autonomous agents</Text>
          <Text style={styles.subtitle}>Don’t just secure the model. Secure what the agent is allowed to do in real-time.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/onboarding-protection')}>
            <Text style={styles.footerActionText}>Skip</Text>
          </Pressable>

          <View style={styles.pagination}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable onPress={() => router.push('/onboarding-runtime')}>
            <Text style={[styles.footerActionText, styles.nextText]}>Next</Text>
          </Pressable>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/onboarding-runtime')}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D111A' },
  topSection: { height: '52%', backgroundColor: '#0D111A', borderBottomLeftRadius: 36, borderBottomRightRadius: 36, justifyContent: 'center', alignItems: 'center' },
  illContainer: { justifyContent: 'center', alignItems: 'center', position: 'relative', width: 180, height: 180 },
  accentCircle: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: '#4F46E5', top: 5, right: 15, opacity: 0.8 },
  cardBack: { position: 'absolute', width: 130, height: 85, backgroundColor: '#1E1B4B', borderRadius: 14, transform: [{ rotate: '-12deg' }, { translateX: -12 }, { translateY: -8 }], justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cardFront: { position: 'absolute', width: 150, height: 95, backgroundColor: '#3B82F6', borderRadius: 14, transform: [{ rotate: '4deg' }, { translateY: 12 }], justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
  bottomSection: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 24, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  textContainer: { alignItems: 'center', marginTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8, lineHeight: 30 },
  subtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', lineHeight: 17, paddingHorizontal: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  footerActionText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  nextText: { color: '#0F172A', fontWeight: '700' },
  pagination: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  activeDot: { backgroundColor: '#0F172A', width: 16 },
  buttonGroup: { gap: 8 },
  primaryButton: { backgroundColor: '#2563EB', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' }
});
