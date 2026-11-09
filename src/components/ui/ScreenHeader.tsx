import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { type } from "../../styles/typography";

/** The 44pt round back button the redesign puts on every inner screen. */
export function BackButton({
  onPress,
  rtl = false,
  tone = "soft",
  label = "Go back",
}: {
  onPress: () => void;
  rtl?: boolean;
  /** "glass" sits on a photo. */
  tone?: "soft" | "glass";
  label?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        tone === "glass" ? styles.glass : styles.soft,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        color={tone === "glass" ? colors.dark : colors.primary}
        name={rtl ? "chevron-forward" : "chevron-back"}
        size={22}
      />
    </Pressable>
  );
}

/** A round icon action matching the back button, e.g. share or save. */
export function RoundAction({
  children,
  label,
  onPress,
  tone = "soft",
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
  tone?: "soft" | "glass";
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        tone === "glass" ? styles.glass : styles.soft,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Back button, an optional title and optional trailing actions. */
export function ScreenHeader({
  onBack,
  title,
  rtl = false,
  actions,
}: {
  onBack: () => void;
  title?: string;
  rtl?: boolean;
  actions?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} rtl={rtl} />
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {title ?? ""}
      </Text>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: gutter,
    paddingTop: topSpace,
  },
  title: { ...type.item, color: colors.dark, flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  round: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  soft: { backgroundColor: colors.soft },
  glass: { backgroundColor: "rgba(255,255,255,0.9)" },
  pressed: { opacity: 0.7 },
});
