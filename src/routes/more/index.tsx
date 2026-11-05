import { Linking, ScrollView, StyleSheet, Text } from "react-native";
import { MenuGroup, MenuRow } from "../../components/ui/MenuRow";
import {
  isRtl,
  languageName,
  navLabels,
  type AppLocale,
} from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { colors, gutter } from "../../styles/tokens";
import { type } from "../../styles/typography";

/** The website's Shop action (header and drawer) opens the official store. */
const SHOP_URL = "https://store.visitkurdistan.krd";

export function MoreScreen({
  onOpenChat,
  onOpenProfile,
  onOpenFaqs,
  onOpenContact,
  onOpenLanguage,
  onOpenNotifications,
  onOpenMap,
  onOpenTripPlanner,
  signedIn,
  locale,
}: {
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onOpenFaqs: () => void;
  onOpenContact: () => void;
  onOpenLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenMap: () => void;
  onOpenTripPlanner: () => void;
  signedIn: boolean;
  locale: AppLocale;
}) {
  const t = webT(locale);
  const rtl = isRtl(locale);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        {navLabels[locale].more}
      </Text>
      <MenuGroup label="Plan">
        <MenuRow
          divider={false}
          icon="git-branch-outline"
          title={t("exploreMap.ctaPrimaryLabel")}
          detail="A day-by-day plan from confirmed places"
          rtl={rtl}
          onPress={onOpenTripPlanner}
        />
        <MenuRow
          icon="map-outline"
          title={t("exploreMap.title")}
          rtl={rtl}
          onPress={onOpenMap}
        />
        <MenuRow
          icon="chatbubble-outline"
          title="Trip assistant"
          rtl={rtl}
          onPress={onOpenChat}
        />
      </MenuGroup>
      <MenuGroup label="You">
        <MenuRow
          divider={false}
          icon="person-outline"
          title={
            signedIn
              ? t("header.account.menuLabel")
              : t("header.account.signInOrCreate")
          }
          rtl={rtl}
          onPress={onOpenProfile}
        />
        <MenuRow
          icon="notifications-outline"
          title="Travel notifications"
          rtl={rtl}
          onPress={onOpenNotifications}
        />
        <MenuRow
          icon="globe-outline"
          title="Language"
          detail={languageName(locale)}
          rtl={rtl}
          onPress={onOpenLanguage}
        />
      </MenuGroup>
      <MenuGroup label="Help">
        <MenuRow
          divider={false}
          icon="help-circle-outline"
          title="Frequently asked questions"
          rtl={rtl}
          onPress={onOpenFaqs}
        />
        <MenuRow
          icon="mail-outline"
          title="Contact Visit Kurdistan"
          rtl={rtl}
          onPress={onOpenContact}
        />
        <MenuRow
          icon="bag-handle-outline"
          title="Shop"
          detail="store.visitkurdistan.krd"
          rtl={rtl}
          onPress={() => void Linking.openURL(SHOP_URL)}
        />
      </MenuGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: {
    gap: 8,
    paddingBottom: 32,
    paddingHorizontal: gutter,
    paddingTop: 12,
  },
  title: { ...type.title, color: colors.dark },
});
