import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes } from '../theme';

export default function Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Account, notifications, and workspace preferences.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700', marginTop: spacing.lg },
  subtitle: { color: colors.textMuted, fontSize: fontSizes.sm, marginTop: spacing.xs },
});