import { useState, type ComponentProps } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "../../styles/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export interface TabItem {
  key: string;
  label: string;
  icon: IconName;
  /** The filled glyph shown while the tab is active. */
  activeIcon: IconName;
  /**
   * The bar's centrepiece, sitting in a notch cut into the bar: the action
   * the app most wants visitors to try (the trip assistant).
   */
  featured?: boolean;
}

const BAR_HEIGHT = 64;
const BAR_GAP = 12;
/** The featured button, and the clear ring of page around it in the notch. */
const BUTTON = 56;
const RING = 6;
/** How far the button's centre sits below the bar's top edge. */
const BUTTON_DROP = 6;
/** The rounded shoulders where the bar's top edge meets the notch. */
const SHOULDER = 10;
/** Room above the bar for the raised half of the button, inside the dock. */
const TOP_ROOM = BUTTON / 2 - BUTTON_DROP + 2;

/**
 * The height the bar takes at the bottom of the window, raised button
 * included: inner screens end here so nothing sits under the bar.
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + TOP_ROOM + Math.max(insets.bottom, BAR_GAP);
}

/** How far a tab screen's content must reach so it can scroll clear of the bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + TOP_ROOM + Math.max(insets.bottom, BAR_GAP) + 16;
}

/**
 * The bar's outline: a pill with a round notch in the middle of its top
 * edge, joined to the edge by small rounded shoulders.
 */
function barPath(width: number): string {
  const r = BAR_HEIGHT / 2;
  const cx = width / 2;
  const notch = BUTTON / 2 + RING;
  const k = SHOULDER;
  // A shoulder circle touches the top edge and the notch circle from outside.
  const reach = Math.sqrt((notch + k) ** 2 - (k - BUTTON_DROP) ** 2);
  const ratio = notch / (notch + k);
  const tx = reach * ratio;
  const ty = BUTTON_DROP + (k - BUTTON_DROP) * ratio;
  return [
    `M ${r} 0`,
    `H ${cx - reach}`,
    `A ${k} ${k} 0 0 1 ${cx - tx} ${ty}`,
    `A ${notch} ${notch} 0 0 0 ${cx + tx} ${ty}`,
    `A ${k} ${k} 0 0 1 ${cx + reach} 0`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${BAR_HEIGHT}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    "Z",
  ].join(" ");
}

/**
 * The floating tab bar: a purple pill inset from the screen edges, icons
 * only, in equal slots so the spacing is identical. The current tab sits in a
 * soft white circle with a lime icon. The featured item (the assistant) is a
 * lime circle resting in a notch cut into the bar, with a clear ring around
 * it. Each tab keeps its name for screen readers.
 */
export function TabBar({
  items,
  active,
  rtl = false,
  onPress,
}: {
  items: TabItem[];
  active: string | null;
  rtl?: boolean;
  onPress: (key: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const featured = items.find((item) => item.featured);
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      pointerEvents="box-none"
      style={[styles.dock, { bottom: Math.max(insets.bottom, BAR_GAP) }]}
    >
      {width ? (
        <View pointerEvents="none" style={styles.shape}>
          <Svg height={BAR_HEIGHT} width={width}>
            <Path
              d={featured ? barPath(width) : pillPath(width)}
              fill={colors.primary}
            />
          </Svg>
        </View>
      ) : null}
      <View accessibilityRole="tablist" style={[styles.bar, rtl && styles.rtl]}>
        {items.map((item) => {
          // The featured slot stays empty so the four tabs keep equal gaps;
          // its button is drawn over the notch below.
          if (item.featured) return <View key={item.key} style={styles.slot} />;
          const selected = item.key === active;
          return (
            <View key={item.key} style={styles.slot}>
              <Pressable
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                hitSlop={4}
                onPress={() => onPress(item.key)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabActive,
                  pressed && !selected && styles.tabPressed,
                ]}
              >
                <Ionicons
                  color={selected ? colors.lime : "rgba(255,255,255,0.72)"}
                  name={selected ? item.activeIcon : item.icon}
                  size={22}
                />
              </Pressable>
            </View>
          );
        })}
      </View>
      {featured && width ? (
        <Pressable
          accessibilityLabel={featured.label}
          accessibilityRole="button"
          hitSlop={4}
          onPress={() => onPress(featured.key)}
          style={({ pressed }) => [
            styles.featured,
            { left: width / 2 - BUTTON / 2 },
            pressed && styles.featuredPressed,
          ]}
        >
          <Ionicons color={colors.primary} name="sparkles" size={26} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** A plain pill, for a bar without a featured item. */
function pillPath(width: number): string {
  const r = BAR_HEIGHT / 2;
  return `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width - r} ${BAR_HEIGHT} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

const styles = StyleSheet.create({
  dock: {
    height: BAR_HEIGHT + TOP_ROOM,
    left: 16,
    position: "absolute",
    right: 16,
  },
  // The drawn bar; its shadow follows the notched outline on iOS.
  shape: {
    left: 0,
    position: "absolute",
    right: 0,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    top: TOP_ROOM,
  },
  bar: {
    alignItems: "center",
    flexDirection: "row",
    height: BAR_HEIGHT,
    marginTop: TOP_ROOM,
    paddingHorizontal: 4,
  },
  rtl: { flexDirection: "row-reverse" },
  slot: { alignItems: "center", flex: 1, justifyContent: "center" },
  tab: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  // Lime is kept for the assistant; the current tab is a soft white circle.
  tabActive: { backgroundColor: "rgba(255,255,255,0.16)" },
  tabPressed: { backgroundColor: "rgba(255,255,255,0.12)" },
  featured: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    elevation: 6,
    height: BUTTON,
    justifyContent: "center",
    position: "absolute",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    top: TOP_ROOM + BUTTON_DROP - BUTTON / 2,
    width: BUTTON,
  },
  featuredPressed: { backgroundColor: colors.limePressed },
});
