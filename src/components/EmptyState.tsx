import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../styles/tokens";
import { type } from "../styles/typography";
import { Button, type ButtonStyle } from "./ui/Button";

/**
 * The redesign's empty state: a tinted icon, a heading, one sentence and an
 * optional action. `compact` drops the icon for empty sections inside a page.
 */
export function EmptyState({
  title,
  detail,
  icon = "search-outline",
  action,
  compact = false,
}: {
  title: string;
  detail: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  action?: { label: string; onPress: () => void; kind?: ButtonStyle };
  compact?: boolean;
}) {
  return (
    <View style={[styles.root, compact && styles.compact]}>
      {compact ? null : (
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name={icon} size={28} />
        </View>
      )}
      <Text style={compact ? styles.compactTitle : styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {action ? (
        <Button
          kind={action.kind ?? "secondary"}
          label={action.label}
          onPress={action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 56,
  },
  compact: {
    backgroundColor: colors.soft,
    borderRadius: radius.media,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  title: { ...type.section, color: colors.dark, textAlign: "center" },
  compactTitle: { ...type.item, color: colors.dark, textAlign: "center" },
  detail: { ...type.body, color: colors.body, textAlign: "center" },
  action: { alignSelf: "center", marginTop: 4 },
});
