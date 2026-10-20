import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Cpu } from 'lucide-react-native';

export default function OnboardingReviewScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.illContainer}>
          <View style={styles.floatingSquare} />
          <View style={styles.floatingCircle} />
          <Cpu color="#3B82F6" size={60} strokeWidth={1.5} />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>No manual review{"\n"}required</Text>
          <Text style={styles.subtitle}>Just set your parameters and choose the best amount for your goal</Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerActionText}>Back</Text>
          </Pressable>

          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>

          <Pressable onPress={() => router.push('/onboarding-protection')}>
            <Text style={[styles.footerActionText, styles.nextText]}>Next</Text>
          </Pressable>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/onboarding-protection')}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D111A' },
  topSection: { height: '52%', backgroundColor: '#0D111A', borderBottomLeftRadius: 36, borderBottomRightRadius: 36, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  illContainer: { justifyContent: 'center', alignItems: 'center', position: 'relative', width: 180, height: 180 },
  floatingSquare: { position: 'absolute', width: 60, height: 60, borderRadius: 14, backgroundColor: '#3B82F6', bottom: 10, left: 15, opacity: 0.8 },
  floatingCircle: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: '#2563EB', top: 5, left: 20, opacity: 0.9 },
  bottomSection: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 24 },
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
