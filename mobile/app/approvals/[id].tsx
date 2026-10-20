import { Text, View, StyleSheet, Pressable } from "react-native"; 
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors } from "../../src/theme/colors";

export default function ApprovalDetail() { 
  const router = useRouter();
  const { id } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Approval Detail</Text>
      <Text style={styles.id}>{id}</Text>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={{color: '#fff'}}>Close</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceElevated, padding: 24, justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: 'bold' },
  id: { color: colors.secondary, marginTop: 8 },
  btn: { marginTop: 24, backgroundColor: colors.border, padding: 12, borderRadius: 8, alignItems: 'center'}
});
