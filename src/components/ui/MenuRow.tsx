import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../styles/tokens";
import { type } from "../../styles/typography";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** A labelled group of menu rows, as on More and Account. */
export function MenuGroup({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}
      <View>{children}</View>
    </View>
  );
}

/** A tinted icon tile, a title, an optional detail line and a chevron. */
export function MenuRow({
  icon,
  title,
  detail,
  divider = true,
  trailing,
  rtl = false,
  onPress,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  /** The hairline above the row; off for a group's first row. */
  divider?: boolean;
  /** Replaces the chevron, e.g. with a switch. */
  trailing?: ReactNode;
  /** Arabic and Kurdish: the chevron points left, the reading direction. */
  rtl?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tile}>
        <Ionicons color={colors.primary} name={icon} size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {trailing ?? (
        <Ionicons
          color={colors.muted}
          name={rtl ? "chevron-back" : "chevron-forward"}
          size={22}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  groupLabel: { ...type.smallStrong, color: colors.muted, marginTop: 8 },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 64,
    paddingVertical: 12,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  pressed: { backgroundColor: colors.soft },
  tile: {
    alignItems: "center",
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  copy: { flex: 1, gap: 3 },
  title: { ...type.item, color: colors.dark },
  detail: { ...type.small, color: colors.muted },
});
