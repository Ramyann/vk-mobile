import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text } from "./Text";
import { colors, radius } from "../../styles/tokens";
import { type } from "../../styles/typography";

export type ButtonStyle = "primary" | "secondary" | "lime" | "quiet";

/**
 * The redesign's Button component: a 52pt pill (44pt for Quiet) in four
 * styles, with pressed and disabled states from the Figma variants.
 */
export function Button({
  label,
  onPress,
  kind = "primary",
  disabled = false,
  loading = false,
  icon,
  fill = false,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: ButtonStyle;
  disabled?: boolean;
  loading?: boolean;
  /** Shown before the label. */
  icon?: ReactNode;
  /** Stretch to the parent's width. */
  fill?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={kind === "quiet" ? 4 : 0}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[kind],
        pressed && pressedStyles[kind],
        fill && styles.fill,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor[kind]} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            numberOfLines={1}
            style={[type.button, { color: labelColor[kind] }]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const labelColor: Record<ButtonStyle, string> = {
  primary: colors.white,
  secondary: colors.primary,
  lime: colors.dark,
  quiet: colors.primary,
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  row: { alignItems: "center", flexDirection: "row", gap: 8 },
  primary: { backgroundColor: colors.primary },
  secondary: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  lime: { backgroundColor: colors.lime },
  quiet: { height: 44, paddingHorizontal: 4 },
  fill: { alignSelf: "stretch" },
  disabled: { opacity: 0.4 },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primaryTint },
  lime: { backgroundColor: colors.limePressed },
  quiet: { backgroundColor: colors.primaryTint, paddingHorizontal: 12 },
});
