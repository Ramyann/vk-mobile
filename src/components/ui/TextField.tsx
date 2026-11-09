import { useState, type ComponentProps, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "./Text";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";

type InputProps = Pick<
  ComponentProps<typeof TextInput>,
  | "autoComplete"
  | "autoCapitalize"
  | "keyboardType"
  | "multiline"
  | "placeholder"
  | "returnKeyType"
  | "textContentType"
  | "onSubmitEditing"
>;

/**
 * The redesign's field: a label above a 52pt sunken field that takes a 2pt
 * purple ring while focused. Password fields get a show and hide toggle.
 */
export function TextField({
  label,
  value,
  onChangeText,
  secure = false,
  showLabel = "Show password",
  hideLabel = "Hide password",
  error,
  trailing,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  showLabel?: string;
  hideLabel?: string;
  /** Shown under the field, in red. */
  error?: string | null;
  trailing?: ReactNode;
} & InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          input.multiline && styles.multiline,
          focused && styles.focused,
          Boolean(error) && styles.invalid,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={secure ? "none" : input.autoCapitalize}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure && hidden}
          style={[styles.input, input.multiline && styles.multilineInput]}
          textAlignVertical={input.multiline ? "top" : "center"}
          value={value}
          {...input}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={hidden ? showLabel : hideLabel}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setHidden((current) => !current)}
          >
            <Ionicons
              color={colors.muted}
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
            />
          </Pressable>
        ) : (
          trailing
        )}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  label: { ...type.smallStrong, color: colors.dark },
  field: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: radius.input,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  multiline: { alignItems: "flex-start", minHeight: 120, paddingVertical: 10 },
  focused: { borderColor: colors.primary },
  invalid: { borderColor: colors.danger },
  input: {
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 48,
  },
  multilineInput: { minHeight: 96 },
  error: { ...type.small, color: colors.danger },
});
