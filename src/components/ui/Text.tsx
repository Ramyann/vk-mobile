import { createContext, forwardRef, useContext } from "react";
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextInputProps,
  type TextProps,
} from "react-native";

/** True while the app reads right to left (Arabic and Kurdish). */
export const RightToLeft = createContext(false);

const useRightToLeft = () => useContext(RightToLeft) && Platform.OS !== "web";

/**
 * The app's Text. On phones a `direction: "rtl"` parent mirrors the layout
 * but leaves text aligned left, so in Arabic and Kurdish every line gets a
 * right-to-left writing direction, which aligns it to the right. (An
 * explicit `textAlign: "right"` does not work here: inside a right-to-left
 * layout React Native swaps it back to the left.) A style that sets its own
 * alignment (centred titles) still wins. The web needs none of this: the
 * `dir` attribute aligns text there.
 */
export function Text({ style, ...props }: TextProps) {
  const rtl = useRightToLeft();
  return <NativeText {...props} style={rtl ? [styles.text, style] : style} />;
}

/** The app's TextInput: typing starts on the right in Arabic and Kurdish. */
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  function TextInput({ style, ...props }, ref) {
    const rtl = useRightToLeft();
    return (
      <NativeTextInput
        {...props}
        ref={ref}
        style={rtl ? [styles.input, style] : style}
      />
    );
  },
);

const styles = StyleSheet.create({
  text: { writingDirection: "rtl" },
  input: { textAlign: "right" },
});
