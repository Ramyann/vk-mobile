import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../styles/tokens";

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.card,
    padding: 28,
  },
  title: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  detail: {
    color: colors.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
