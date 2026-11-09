import { Linking, ScrollView, StyleSheet } from "react-native";
import { Text } from "../../components/ui/Text";
import { MenuGroup, MenuRow } from "../../components/ui/MenuRow";
import {
  isRtl,
  languageName,
  navLabels,
  type AppLocale,
} from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { colors, gutter, topSpace } from "../../styles/tokens";
import { type } from "../../styles/typography";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { ta } from "../../i18n/app-messages";

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
  const tabBarSpace = useTabBarSpace();
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {navLabels[locale].more}
      </Text>
      <MenuGroup label={ta(locale, "groupPlan")}>
        <MenuRow
          divider={false}
          icon="git-branch-outline"
          title={t("exploreMap.ctaPrimaryLabel")}
          detail={ta(locale, "planDetail")}
          rtl={rtl}
          onPress={onOpenTripPlanner}
        />
        <MenuRow
          icon="map-outline"
          title={ta(locale, "exploreTheMap")}
          rtl={rtl}
          onPress={onOpenMap}
        />
        <MenuRow
          icon="chatbubble-outline"
          title={ta(locale, "tripAssistant")}
          rtl={rtl}
          onPress={onOpenChat}
        />
      </MenuGroup>
      <MenuGroup label={ta(locale, "groupYou")}>
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
          title={ta(locale, "travelNotifications")}
          rtl={rtl}
          onPress={onOpenNotifications}
        />
        <MenuRow
          icon="globe-outline"
          title={ta(locale, "language")}
          detail={languageName(locale)}
          rtl={rtl}
          onPress={onOpenLanguage}
        />
      </MenuGroup>
      <MenuGroup label={ta(locale, "groupHelp")}>
        <MenuRow
          divider={false}
          icon="help-circle-outline"
          title={ta(locale, "faq")}
          rtl={rtl}
          onPress={onOpenFaqs}
        />
        <MenuRow
          icon="mail-outline"
          title={ta(locale, "contactUs")}
          rtl={rtl}
          onPress={onOpenContact}
        />
        <MenuRow
          icon="bag-handle-outline"
          title={ta(locale, "shop")}
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
    paddingTop: topSpace + 8,
  },
  title: { ...type.title, color: colors.dark },
});
