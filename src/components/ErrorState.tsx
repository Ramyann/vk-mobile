import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../styles/tokens";

export function ErrorState({
  title = "Unable to load this right now",
  detail,
  onRetry,
}: {
  title?: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.card,
    margin: 20,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  buttonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
