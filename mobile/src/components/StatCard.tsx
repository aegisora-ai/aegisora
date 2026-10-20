import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSizes } from '../theme';

type Props = {
  label: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
};

export function StatCard({ label, value, change, icon }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {change && <Text style={styles.change}>{change}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  label: { color: colors.textMuted, fontSize: fontSizes.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  value: { color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700' },
  change: { color: colors.low, fontSize: fontSizes.sm, fontWeight: '600' },
});