import { useEffect, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import {
  BackHandler,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
import { colors } from "./styles/tokens";
import { TabBar, useTabBarHeight } from "./components/ui/TabBar";
import {
  ChangePasswordScreen,
  ForgotPasswordScreen,
  LoginScreen,
  ProfileScreen,
  SignupScreen,
} from "./components/account/AccountScreen";
import { ChatScreen } from "./components/chat/ChatScreen";
import { ContactScreen, FaqScreen, LanguageScreen } from "./routes/contact";
import { NotificationSettingsScreen } from "./routes/notifications";
import { PlacesMapScreen } from "./routes/map";
import { TripPlannerScreen } from "./routes/trip-planner";
import { webT } from "./i18n/web";
import { isRtl, navLabels, type AppLocale } from "./i18n/locale";
import {
  loadAuthSession,
  loadLocale,
  saveLocale,
  type AuthSession,
} from "./lib/storage";
import { setAuthSession, subscribeAuthSession } from "./lib/auth-store";
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
  | "signup"
  | "forgot-password"
  | "profile"
  | "change-password"
  | "faqs"
  | "contact"
  | "language"
  | "notifications"
  | "map"
  | "trip-planner"
  | "search";
type NavigationAction = Tab | "assistant";

/**
 * Lays the app out right to left for Arabic and Kurdish. Phones read the
 * `direction` style; React Native Web ignores it and needs the `dir`
 * attribute, which also gives browsers native right-to-left scrolling.
 */
const readingDirection = (rtl: boolean) =>
  Platform.OS === "web" ? ({ dir: rtl ? "rtl" : "ltr" } as object) : {};

/** Panels that keep their state while a detail screen is open over them. */
const OVERLAY_PANELS = new Set<Panel>(["map", "trip-planner"]);

const navigationIcons: Array<{
  key: NavigationAction;
  icon: ComponentProps<typeof Ionicons>["name"];
  activeIcon: ComponentProps<typeof Ionicons>["name"];
  featured?: boolean;
}> = [
  { key: "explore", icon: "home-outline", activeIcon: "home" },
  { key: "discover", icon: "compass-outline", activeIcon: "compass" },
  {
    key: "assistant",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
    featured: true,
  },
  { key: "saved", icon: "bookmark-outline", activeIcon: "bookmark" },
  { key: "more", icon: "menu-outline", activeIcon: "menu" },
];

/**
 * Visit Kurdistan's native companion app.
 *
 * It consumes the existing public CMS APIs; no duplicate catalogue, bookings
 * or editorial data are introduced. The content source remains the dashboard
 * the team already uses for the website.
 */
export function AppRoot() {
  return (
    <SafeAreaProvider>
      <AppShell />
    </SafeAreaProvider>
  );
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  // The bar steps aside while the keyboard is up, so it never covers a field.
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [tab, setTab] = useState<Tab>("explore");
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [saved, setSaved] = useState<ContentItem[]>([]);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [browseType, setBrowseType] = useState<ContentType | null>(null);
  const [locale, setLocale] = useState<AppLocale>("en");
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>(defaultNotificationPreferences);
  /** Where sign-in returns to, e.g. the trip planner. */
  const [afterSignIn, setAfterSignIn] = useState<Panel | null>(null);
  const [tripToken, setTripToken] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadSavedContent().then(setSaved);
    // A token refresh, or a refresh the server refused, reaches the shell here.
    const unsubscribe = subscribeAuthSession(setAuth);
    void loadAuthSession().then((stored) => {
      // Sessions from the older build came from the staff login, which no
      // longer serves visitors; those visitors sign in again.
      const usable = stored && !stored.userType ? stored : null;
      void setAuthSession(usable, Boolean(stored && !usable));
    });
    void loadLocale().then(setLocale);
    return unsubscribe;
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
  const detailScreen = detail ? (
    <DetailScreen
      item={detail}
      locale={locale}
      saved={savedIds.has(`${detail.type}-${detail.id}`)}
      onBack={() => setDetail(null)}
      onToggleSaved={() => toggleSaved(detail)}
    />
  ) : null;

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
    if (parsed.hostname === "plan-your-trip") {
      setDetail(null);
      setBrowseType(null);
      setTripToken(segments[0] ?? null);
      setPanel("trip-planner");
      return;
    }
    if (parsed.hostname === "map") {
      setDetail(null);
      setBrowseType(null);
      setPanel("map");
      return;
    }
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
    // Notifications are phone-only; the web preview skips them.
    if (Platform.OS === "web") return;
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
        if (detail && panel && OVERLAY_PANELS.has(panel)) {
          setDetail(null);
          return true;
        }
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
        onOpenContact={() => setPanel("contact")}
        onOpenFaqs={() => setPanel("faqs")}
      />
    ) : panel === "login" ? (
      <LoginScreen
        locale={locale}
        note={
          authNotice ??
          (afterSignIn === "trip-planner"
            ? webT(locale)("auth.plannerNote")
            : undefined)
        }
        onBack={() => {
          setAuthNotice(null);
          setPanel(afterSignIn === "trip-planner" ? "trip-planner" : null);
          setAfterSignIn(null);
        }}
        onSignedIn={(session) => {
          void setAuthSession(session);
          setAuthNotice(null);
          setPanel(afterSignIn ?? "profile");
          setAfterSignIn(null);
        }}
        onSignup={() => setPanel("signup")}
        onForgot={() => setPanel("forgot-password")}
      />
    ) : panel === "signup" ? (
      <SignupScreen
        locale={locale}
        onBack={() => setPanel("login")}
        onSignIn={() => setPanel("login")}
      />
    ) : panel === "forgot-password" ? (
      <ForgotPasswordScreen locale={locale} onBack={() => setPanel("login")} />
    ) : panel === "profile" && auth ? (
      <ProfileScreen
        session={auth}
        locale={locale}
        onBack={() => setPanel(null)}
        onSignedOut={() => {
          void disablePushNotifications(auth);
          void setAuthSession(null);
          setPanel(null);
        }}
        onChangePassword={() => setPanel("change-password")}
        onOpenTrips={() => setPanel("trip-planner")}
        onOpenSaved={() => {
          setPanel(null);
          setTab("saved");
        }}
        onOpenNotifications={() => setPanel("notifications")}
      />
    ) : panel === "change-password" && auth ? (
      <ChangePasswordScreen
        locale={locale}
        onBack={() => setPanel("profile")}
        onChanged={() => {
          // The server has ended every session, this one included.
          void disablePushNotifications(auth);
          void setAuthSession(null);
          setAuthNotice(webT(locale)("auth.reset.done"));
          setPanel("login");
        }}
      />
    ) : panel === "faqs" ? (
      <FaqScreen locale={locale} onBack={() => setPanel(null)} />
    ) : panel === "contact" ? (
      <ContactScreen locale={locale} onBack={() => setPanel(null)} />
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
    ) : panel === "map" ? (
      <PlacesMapScreen
        locale={locale}
        onBack={() => setPanel(null)}
        onOpen={open}
        onPlanTrip={() => setPanel("trip-planner")}
      />
    ) : panel === "trip-planner" ? (
      <TripPlannerScreen
        initialToken={tripToken}
        locale={locale}
        session={auth}
        onBack={() => {
          setTripToken(null);
          setPanel(null);
        }}
        onSignIn={() => {
          setAfterSignIn("trip-planner");
          setPanel("login");
        }}
        onOpen={open}
        onOpenContact={() => setPanel("contact")}
      />
    ) : detail ? (
      detailScreen
    ) : browseType ? (
      <BrowseScreen
        type={browseType}
        locale={locale}
        onBack={() => setBrowseType(null)}
        onOpen={open}
        onOpenMap={() => setPanel("map")}
      />
    ) : tab === "explore" ? (
      <ExploreScreen
        locale={locale}
        onOpen={open}
        onDiscover={() => setTab("discover")}
        onBrowse={setBrowseType}
        onOpenMap={() => setPanel("map")}
        onPlanTrip={() => setPanel("trip-planner")}
        onSearch={() => setPanel("search")}
      />
    ) : tab === "discover" ? (
      <DiscoverScreen
        locale={locale}
        onOpen={open}
        onOpenMap={() => setPanel("map")}
      />
    ) : tab === "saved" ? (
      <SavedScreen
        saved={saved}
        locale={locale}
        onOpen={open}
        onRemove={toggleSaved}
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
        onOpenMap={() => setPanel("map")}
        onOpenTripPlanner={() => setPanel("trip-planner")}
        signedIn={Boolean(auth)}
      />
    );

  // The four tab screens scroll under the floating bar; every other screen
  // ends above it. Log in, sign up and the chat take the whole screen.
  const onTab = !detail && !panel && !browseType;
  const fullScreen =
    panel === "chat" ||
    panel === "login" ||
    panel === "signup" ||
    panel === "forgot-password";
  const showTabs = !fullScreen && !keyboardOpen;
  // Home's hero, a detail's photo and the map run under the status bar;
  // every other screen starts below it.
  const edgeToEdge =
    (onTab && tab === "explore") || Boolean(detail) || panel === "map";
  return (
    <AppQueryProvider>
      <View
        style={[
          styles.root,
          !edgeToEdge && { paddingTop: insets.top },
          !showTabs && { paddingBottom: insets.bottom },
          showTabs && !onTab && { paddingBottom: tabBarHeight },
        ]}
      >
        {edgeToEdge ? null : <StatusBar style="dark" />}
        <View
          {...readingDirection(isRtl(locale))}
          style={[
            styles.content,
            isRtl(locale) && Platform.OS !== "web" && styles.rtl,
          ]}
        >
          {screen}
          {/* A place opened from the map or an itinerary sits on top, so going
              back returns to the same filters or the same trip. */}
          {detailScreen && panel && OVERLAY_PANELS.has(panel) ? (
            <View style={[StyleSheet.absoluteFill, styles.overlay]}>
              {detailScreen}
            </View>
          ) : null}
        </View>
        {showTabs ? (
          <TabBar
            active={tab}
            items={navigation}
            rtl={isRtl(locale)}
            onPress={(key) => {
              // A tab always leads back to that tab's top screen.
              setDetail(null);
              setBrowseType(null);
              if (key === "assistant") setPanel("chat");
              else {
                setPanel(null);
                setTab(key as Tab);
              }
            }}
          />
        ) : null}
        <SearchSheet
          visible={panel === "search"}
          locale={locale}
          onClose={() => setPanel(null)}
          onOpen={open}
        />
      </View>
    </AppQueryProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.white, flex: 1 },
  content: { flex: 1 },
  rtl: { direction: "rtl" },
  overlay: { backgroundColor: colors.white },
});
