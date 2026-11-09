import { Pressable, StyleSheet } from "react-native";
import { Text } from "./Text";
import { colors, radius } from "../../styles/tokens";
import { type } from "../../styles/typography";

/** The redesign's filter chip: 36pt, outlined, solid purple when selected. */
export function Chip({
  label,
  count,
  selected,
  onPress,
}: {
  label: string;
  /** A result count, set lighter after the label so it doesn't read as part of the name. */
  count?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          type.smallStrong,
          { color: selected ? colors.white : colors.dark },
        ]}
      >
        {label}
      </Text>
      {count ? (
        <Text
          style={[
            styles.count,
            { color: selected ? "rgba(255,255,255,0.7)" : colors.muted },
          ]}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.primaryTint },
  count: { ...type.caption, lineHeight: 16 },
});
