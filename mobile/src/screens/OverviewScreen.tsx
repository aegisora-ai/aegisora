import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Activity, ShieldAlert, Server, Zap } from 'lucide-react-native';
import { StatCard } from '../components/StatCard';
import { colors, spacing, radius, fontSizes } from '../theme';

export default function OverviewScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Sample data. Not yet connected to Aegisora Core.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Environment Overview</Text>
        <Text style={styles.subtitle}>Real-time metrics for your production AI agents.</Text>

        <View style={styles.grid}>
          <StatCard label="Total Intercepted" value="2.4M" change="+14%" icon={<Activity size={18} color={colors.primary} />} />
          <StatCard label="Actions Blocked" value="18,400" change="+2%" icon={<ShieldAlert size={18} color={colors.critical} />} />
          <StatCard label="Active Agents" value="37" change="+5" icon={<Server size={18} color={colors.low} />} />
          <StatCard label="Avg. Latency" value="18ms" change="-2ms" icon={<Zap size={18} color={colors.medium} />} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: {
    backgroundColor: 'rgba(234,179,8,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234,179,8,0.3)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bannerText: { color: colors.medium, fontSize: fontSizes.xs },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontSize: fontSizes.xxl, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSizes.sm, marginTop: spacing.xs, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});