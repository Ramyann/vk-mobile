import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";
import { colors, gutter } from "../styles/tokens";
import { type } from "../styles/typography";
import { Button } from "./ui/Button";

/** A section heading with an optional action on the trailing side. */
export function SectionHeading({
  title,
  action,
  inset = false,
}: {
  title: string;
  action?: ReactNode;
  /** Add the page gutter, for headings above a full-bleed rail. */
  inset?: boolean;
}) {
  return (
    <View style={[styles.root, inset && styles.inset]}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {action}
    </View>
  );
}

/** The Quiet button used as a section's "See all". */
export function TextAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return <Button kind="quiet" label={label} onPress={onPress} />;
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 44,
  },
  inset: { paddingHorizontal: gutter },
  title: { ...type.section, color: colors.dark, flexShrink: 1 },
});
