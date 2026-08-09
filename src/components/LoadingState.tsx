import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../styles/tokens";

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 32,
  },
  label: { color: colors.body, fontSize: 14 },
});
