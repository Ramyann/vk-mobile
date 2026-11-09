import type { ReactNode } from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

/**
 * A horizontal list that starts at the reading edge. React Native's new
 * architecture opens a horizontal ScrollView at the right in a right-to-left
 * layout, and browsers do the same for `dir="rtl"`, so Arabic and Kurdish
 * need no extra handling here.
 */
export function Rail({
  children,
  ...props
}: ScrollViewProps & { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} {...props}>
      {children}
    </ScrollView>
  );
}
