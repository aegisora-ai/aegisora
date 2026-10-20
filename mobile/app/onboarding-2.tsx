import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Sliders } from 'lucide-react-native';
import { colors } from '../src/theme/colors';

export default function Onboarding2() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* �st Kavisli B�l�m - Tasar�mdaki iki renkli yap�y� dark mode'a uyarlad�k */}
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Sliders color={colors.primary} size={90} strokeWidth={1.5} />
        </View>
      </View>

      {/* Alt Metin ve Buton B�l�m� */}
      <SafeAreaView style={styles.bottomSection}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Automate{"\n"}runtime security</Text>
          <Text style={styles.subtitle}>Enforce policies automatically, so you never have to worry about rogue agent actions.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/sign-in')} style={{ padding: 10 }}>
            <Text style={styles.footerActionText}>Skip</Text>
          </Pressable>

          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>

          <Pressable onPress={() => router.push('/sign-in')} style={{ padding: 10 }}>
            <Text style={[styles.footerActionText, styles.nextText]}>Next</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  topSection: {
    height: '55%',
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bottomSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerActionText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  nextText: {
    color: colors.text,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    backgroundColor: colors.primary,
  }
});
