import { Children, type ReactNode } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";

/**
 * A horizontal list that starts at the reading edge.
 *
 * On a phone, a right-to-left layout set through the `direction` style lays
 * the cards out from the right but still opens scrolled to the left, so the
 * first card is off screen. The rail mirrors itself and each card instead,
 * which puts the first card at the right edge and makes a rightward swipe
 * reveal the next one. Browsers handle `dir="rtl"` natively, so the web
 * preview needs none of this.
 */
export function Rail({
  rtl = false,
  children,
  style,
  contentContainerStyle,
  ...props
}: ScrollViewProps & { rtl?: boolean; children: ReactNode }) {
  const mirror = rtl && Platform.OS !== "web";
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      {...props}
      contentContainerStyle={[contentContainerStyle, mirror && styles.ltr]}
      style={[style, mirror && styles.flip]}
    >
      {mirror
        ? Children.map(children, (child) =>
            child ? <View style={styles.card}>{child}</View> : child,
          )
        : children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flip: { transform: [{ scaleX: -1 }] },
  ltr: { direction: "ltr" },
  // Each card is mirrored back and keeps its own right-to-left layout.
  card: { direction: "rtl", transform: [{ scaleX: -1 }] },
});
