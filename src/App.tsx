import { useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import {
  BackHandler,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import type { ContentItem, ContentType } from "./api/content";
import { BrowseScreen } from "./routes/destinations";
import { DetailScreen } from "./routes/details";
import { DiscoverScreen } from "./routes/discover";
import { ExploreScreen } from "./routes/home";
import { MoreScreen } from "./routes/more";
import { SavedScreen } from "./routes/saved";
import { SearchSheet } from "./components/search/SearchSheet";
import {
  addSavedContent,
  loadSavedContent,
  mergeSavedContent,
  removeSavedContent,
  saveSavedContent,
} from "./lib/saved-content";
import { colors, shadows } from "./styles/tokens";
import {
  ChangePasswordScreen,
  LoginScreen,
  ProfileScreen,
} from "./components/account/AccountScreen";
import { ChatScreen } from "./components/chat/ChatScreen";
import { ContactScreen, FaqScreen, LanguageScreen } from "./routes/contact";
import { NotificationSettingsScreen } from "./routes/notifications";
import { NearbyPlacesScreen } from "./routes/nearby";
import { isRtl, navLabels, type AppLocale } from "./i18n/locale";
import {
  loadAuthSession,
  loadLocale,
  saveAuthSession,
  saveLocale,
  type AuthSession,
} from "./lib/storage";
import {
  cancelSavedEventReminder,
  disablePushNotifications,
  scheduleSavedEventReminder,
} from "./lib/notifications";
import { AppQueryProvider } from "./lib/query-client";
import {
  defaultNotificationPreferences,
  getMobileState,
  replaceMobileSavedContent,
  type NotificationPreferences,
} from "./api/mobile";

type Tab = "explore" | "discover" | "saved" | "more";
type Panel =
  | "chat"
  | "login"
  | "profile"
  | "change-password"
  | "faqs"
  | "contact"
  | "language"
  | "notifications"
  | "nearby"
  | "search";
type NavigationAction = Tab | "assistant";

const navigationIcons: Array<{
  key: NavigationAction;
  icon: ComponentProps<typeof Ionicons>["name"];
}> = [
  { key: "explore", icon: "home-outline" },
  { key: "discover", icon: "compass-outline" },
  { key: "assistant", icon: "chatbubble-ellipses" },
  { key: "saved", icon: "bookmark-outline" },
  { key: "more", icon: "menu-outline" },
];

/**
 * Visit Kurdistan's native companion app.
 *
 * It consumes the existing public CMS APIs; no duplicate catalogue, bookings
 * or editorial data are introduced. The content source remains the dashboard
 * the team already uses for the website.
 */
export function AppRoot() {
  const [tab, setTab] = useState<Tab>("explore");
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [saved, setSaved] = useState<ContentItem[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [browseType, setBrowseType] = useState<ContentType | null>(null);
  const [locale, setLocale] = useState<AppLocale>("en");
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(defaultNotificationPreferences);

  useEffect(() => {
    void loadSavedContent().then(setSaved);
    void loadAuthSession().then(setAuth);
    void loadLocale().then(setLocale);
  }, []);

  useEffect(() => {
    if (!auth) {
      setNotificationPreferences(defaultNotificationPreferences);
      return;
    }
    void (async () => {
      try {
        const [remote, local] = await Promise.all([
          getMobileState(auth),
          loadSavedContent(),
        ]);
        const merged = mergeSavedContent(local, remote.savedContent);
        setSaved(merged);
        setNotificationPreferences(remote.notificationPreferences);
        await saveSavedContent(merged);
        if (merged.length !== remote.savedContent.length) {
          await replaceMobileSavedContent(auth, merged);
        }
      } catch {
        // Offline mode keeps local bookmarks and notification choices usable.
      }
    })();
  }, [auth]);

  const savedIds = useMemo(
    () => new Set(saved.map((item) => `${item.type}-${item.id}`)),
    [saved],
  );
  const open = (item: ContentItem) => {
    setBrowseType(null);
    setDetail(item);
  };

  const isContentType = (value: string | undefined): value is ContentType =>
    value === "destination" ||
    value === "place" ||
    value === "event" ||
    value === "package" ||
    value === "story";
  const changeLocale = (next: AppLocale) => {
    setLocale(next);
    void saveLocale(next);
    setPanel(null);
  };
  const openDeepLink = (url: string) => {
    const parsed = Linking.parse(url);
    const segments = (parsed.path ?? "").split("/").filter(Boolean);
    const type = parsed.hostname === "content" ? segments[0] : undefined;
    const slug = parsed.hostname === "content" ? segments[1] : undefined;
    if (!isContentType(type) || !slug) return;
    setPanel(null);
    setBrowseType(null);
    setDetail({
      id: slug,
      slug,
      type,
      title: "Loading…",
      excerpt: "",
      image: null,
    });
  };

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) openDeepLink(url);
    });
    const subscription = Linking.addEventListener("url", ({ url }) =>
      openDeepLink(url),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const redirect = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === "string") openDeepLink(url);
    };
    void Notifications.getLastNotificationResponseAsync().then(redirect);
    const subscription =
      Notifications.addNotificationResponseReceivedListener(redirect);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (
      !notificationPreferences.enabled ||
      !notificationPreferences.savedEventReminders
    )
      return;
    void Promise.all(
      saved
        .filter((item) => item.type === "event")
        .map((item) => scheduleSavedEventReminder(item).catch(() => undefined)),
    );
  }, [
    notificationPreferences.enabled,
    notificationPreferences.savedEventReminders,
    saved,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (panel) {
          setPanel(null);
          return true;
        }
        if (detail) {
          setDetail(null);
          return true;
        }
        if (browseType) {
          setBrowseType(null);
          return true;
        }
        if (tab !== "explore") {
          setTab("explore");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [browseType, detail, panel, tab]);
  const toggleSaved = (item: ContentItem) => {
    const key = `${item.type}-${item.id}`;
    setSaved((current) => {
      const next = current.some((entry) => `${entry.type}-${entry.id}` === key)
        ? current.filter((entry) => `${entry.type}-${entry.id}` !== key)
        : [...current, item];
      void saveSavedContent(next);
      if (auth)
        void replaceMobileSavedContent(auth, next).catch(() => undefined);
      if (next.some((entry) => `${entry.type}-${entry.id}` === key)) {
        void addSavedContent(item).then((cached) => {
          setSaved((latest) => {
            const hydrated = latest.map((entry) =>
              `${entry.type}-${entry.id}` === key ? cached : entry,
            );
            void saveSavedContent(hydrated);
            if (auth)
              void replaceMobileSavedContent(auth, hydrated).catch(
                () => undefined,
              );
            return hydrated;
          });
        });
        if (
          notificationPreferences.enabled &&
          notificationPreferences.savedEventReminders
        )
          void scheduleSavedEventReminder(item).catch(() => undefined);
      } else {
        void removeSavedContent(item);
        void cancelSavedEventReminder(item).catch(() => undefined);
      }
      return next;
    });
  };

  const navigation = navigationIcons.map((item) => ({
    ...item,
    label: navLabels[locale][item.key === "assistant" ? "ask" : item.key],
  }));
  const screen =
    panel === "chat" ? (
      <ChatScreen
        locale={locale}
        onBack={() => setPanel(null)}
        onOpenContent={(item) => {
          setPanel(null);
          setDetail(item);
        }}
      />
    ) : panel === "login" ? (
      <LoginScreen
        onBack={() => setPanel(null)}
        onSignedIn={(session) => {
          setAuth(session);
          void saveAuthSession(session);
          setPanel("profile");
        }}
      />
    ) : panel === "profile" && auth ? (
      <ProfileScreen
        session={auth}
        onBack={() => setPanel(null)}
        onSignedOut={() => {
          void disablePushNotifications(auth);
          setAuth(null);
          void saveAuthSession(null);
          setPanel(null);
        }}
        onChangePassword={() => setPanel("change-password")}
      />
    ) : panel === "change-password" && auth ? (
      <ChangePasswordScreen session={auth} onBack={() => setPanel("profile")} />
    ) : panel === "faqs" ? (
      <FaqScreen locale={locale} onBack={() => setPanel(null)} />
    ) : panel === "contact" ? (
      <ContactScreen onBack={() => setPanel(null)} />
    ) : panel === "language" ? (
      <LanguageScreen
        locale={locale}
        onBack={() => setPanel(null)}
        onSelect={changeLocale}
      />
    ) : panel === "notifications" ? (
      <NotificationSettingsScreen
        session={auth}
        locale={locale}
        preferences={notificationPreferences}
        onBack={() => setPanel(null)}
        onChange={setNotificationPreferences}
      />
    ) : panel === "nearby" ? (
      <NearbyPlacesScreen
        locale={locale}
        onBack={() => setPanel(null)}
        onOpen={open}
      />
    ) : detail ? (
      <DetailScreen
        item={detail}
        locale={locale}
        saved={savedIds.has(`${detail.type}-${detail.id}`)}
        onBack={() => setDetail(null)}
        onToggleSaved={() => toggleSaved(detail)}
      />
    ) : browseType ? (
      <BrowseScreen
        type={browseType}
        locale={locale}
        onBack={() => setBrowseType(null)}
        onOpen={open}
      />
    ) : tab === "explore" ? (
      <ExploreScreen
        locale={locale}
        onOpen={open}
        onDiscover={() => setTab("discover")}
        onBrowse={setBrowseType}
      />
    ) : tab === "discover" ? (
      <DiscoverScreen locale={locale} onOpen={open} />
    ) : tab === "saved" ? (
      <SavedScreen
        saved={saved}
        onOpen={open}
        onDiscover={() => setTab("discover")}
      />
    ) : (
      <MoreScreen
        locale={locale}
        onOpenChat={() => setPanel("chat")}
        onOpenProfile={() => setPanel(auth ? "profile" : "login")}
        onOpenFaqs={() => setPanel("faqs")}
        onOpenContact={() => setPanel("contact")}
        onOpenLanguage={() => setPanel("language")}
        onOpenNotifications={() => setPanel("notifications")}
        onOpenNearby={() => setPanel("nearby")}
        signedIn={Boolean(auth)}
      />
    );

  return (
    <AppQueryProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <View style={[styles.content, isRtl(locale) && styles.rtl]}>
          {screen}
        </View>
        {!panel && !detail && !browseType ? (
          <Pressable
            accessibilityLabel="Search Visit Kurdistan"
            accessibilityRole="button"
            onPress={() => setPanel("search")}
            style={styles.globalSearch}
          >
            <Ionicons color={colors.primary} name="search" size={22} />
          </Pressable>
        ) : null}
        {!detail && !panel && !browseType ? (
          <View style={styles.navigationShell}>
            <View style={styles.tabBar}>
              {navigation.map((item) => {
                const assistant = item.key === "assistant";
                const active = !assistant && tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={
                      assistant ? "Open trip assistant" : item.label
                    }
                    onPress={() => {
                      if (item.key === "assistant") setPanel("chat");
                      else setTab(item.key);
                    }}
                    style={({ pressed }) => [
                      styles.tab,
                      assistant && styles.assistantTab,
                      pressed && styles.tabPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.tabIconWrap,
                        assistant && styles.assistantIconWrap,
                        active && styles.activeIconWrap,
                      ]}
                    >
                      <Ionicons
                        color={
                          assistant
                            ? colors.lime
                            : active
                              ? colors.primary
                              : colors.muted
                        }
                        name={item.icon}
                        size={assistant ? 25 : 22}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        assistant && styles.assistantLabel,
                        active && styles.tabLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
        <SearchSheet
          visible={panel === "search"}
          locale={locale}
          onClose={() => setPanel(null)}
          onOpen={open}
        />
      </SafeAreaView>
    </AppQueryProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.white, flex: 1 },
  content: { flex: 1 },
  rtl: { direction: "rtl" },
  navigationShell: {
    backgroundColor: colors.white,
    paddingBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  tabBar: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: 31,
    flexDirection: "row",
    height: 66,
    justifyContent: "space-around",
    paddingHorizontal: 6,
    ...shadows.dock,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 52,
  },
  tabPressed: { opacity: 0.76, transform: [{ scale: 0.96 }] },
  tabIconWrap: {
    alignItems: "center",
    borderRadius: 18,
    height: 31,
    justifyContent: "center",
    minWidth: 36,
  },
  activeIconWrap: { backgroundColor: colors.lime },
  tabLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  tabLabelActive: { color: colors.primary },
  assistantTab: {
    alignSelf: "stretch",
    justifyContent: "flex-start",
    paddingTop: 0,
    position: "relative",
  },
  assistantIconWrap: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 35,
    borderWidth: 5,
    height: 70,
    marginTop: -31,
    width: 70,
    ...shadows.floatingAction,
  },
  assistantLabel: { color: colors.primary, fontWeight: "800", marginTop: -2 },
  globalSearch: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 24,
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 56,
    width: 46,
    zIndex: 5,
    ...shadows.dock,
  },
});
