import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../../styles/tokens";
import { type } from "../../styles/typography";

/** The redesign's filter chip: 36pt, outlined, solid purple when selected. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
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
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { backgroundColor: colors.primaryTint },
});
