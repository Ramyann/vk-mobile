import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { Text } from "../../components/ui/Text";
import { useTabBarSpace } from "../../components/ui/TabBar";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
  updateNotificationPreferences,
} from "../../api/mobile";
import {
  enablePushNotifications,
  disablePushNotifications,
} from "../../lib/notifications";
import type { AuthSession } from "../../lib/storage";
import { isRtl, type AppLocale } from "../../i18n/locale";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { BackButton } from "../../components/ui/ScreenHeader";
import { MenuRow } from "../../components/ui/MenuRow";
import { type } from "../../styles/typography";
import { ta } from "../../i18n/app-messages";

/** Push notifications are phone-only; the web preview explains instead. */
const PUSH_SUPPORTED = Platform.OS !== "web";

export function NotificationSettingsScreen({
  session,
  locale,
  preferences,
  onBack,
  onChange,
}: {
  session: AuthSession | null;
  locale: AppLocale;
  preferences: NotificationPreferences;
  onBack: () => void;
  onChange: (preferences: NotificationPreferences) => void;
}) {
  const tabBarSpace = useTabBarSpace();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const update = async (next: NotificationPreferences) => {
    if (!PUSH_SUPPORTED) return;
    if (!session) {
      setNotice(ta(locale, "notificationsSignIn"));
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (next.enabled && !preferences.enabled)
        await enablePushNotifications(session, locale);
      if (!next.enabled && preferences.enabled)
        await disablePushNotifications(session);
      const response = await updateNotificationPreferences(session, next);
      onChange({
        ...defaultNotificationPreferences,
        ...response.notificationPreferences,
      });
    } catch {
      setNotice(
        next.enabled && !preferences.enabled
          ? ta(locale, "notificationsEnableFailed")
          : ta(locale, "notificationsSaveFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const Row = ({
    icon,
    title,
    detail,
    value,
    setting,
    first = false,
  }: {
    icon: ComponentProps<typeof Ionicons>["name"];
    title: string;
    detail: string;
    value: boolean;
    setting: keyof NotificationPreferences;
    first?: boolean;
  }) => {
    const master = setting === "enabled";
    // A topic only counts while notifications are on, so it shows off too.
    const shown = master ? value : value && preferences.enabled;
    const disabled =
      !PUSH_SUPPORTED || busy || (!master && !preferences.enabled);
    return (
      <View style={disabled && !master && styles.rowMuted}>
        <MenuRow
          detail={detail}
          divider={!first}
          icon={icon}
          title={title}
          trailing={
            <Switch
              accessibilityLabel={title}
              disabled={disabled}
              ios_backgroundColor={colors.border}
              onValueChange={(next) =>
                void update({ ...preferences, [setting]: next })
              }
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.primary }}
              value={shown}
            />
          }
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
    >
      <View style={styles.back}>
        <BackButton onPress={onBack} rtl={isRtl(locale)} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {ta(locale, "travelNotifications")}
      </Text>
      <Text style={styles.intro}>{ta(locale, "notificationsIntro")}</Text>
      {!PUSH_SUPPORTED ? (
        <View style={styles.note}>
          <Ionicons
            color={colors.primary}
            name="phone-portrait-outline"
            size={22}
          />
          <Text style={styles.noteText}>
            {ta(locale, "notificationsPhoneOnly")}
          </Text>
        </View>
      ) : null}
      <View style={styles.list}>
        <Row
          first
          icon="notifications-outline"
          title={ta(locale, "notifications")}
          detail={ta(locale, "notificationsDetail")}
          value={preferences.enabled}
          setting="enabled"
        />
        <Row
          icon="calendar-outline"
          title={ta(locale, "upcomingEvents")}
          detail={ta(locale, "upcomingEventsDetail")}
          value={preferences.upcomingEvents}
          setting="upcomingEvents"
        />
        <Row
          icon="newspaper-outline"
          title={ta(locale, "contentUpdates")}
          detail={ta(locale, "contentUpdatesDetail")}
          value={preferences.contentUpdates}
          setting="contentUpdates"
        />
        <Row
          icon="alarm-outline"
          title={ta(locale, "eventReminders")}
          detail={ta(locale, "eventRemindersDetail")}
          value={preferences.savedEventReminders}
          setting="savedEventReminders"
        />
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : null}
      {notice ? (
        <Text accessibilityRole="alert" style={styles.notice}>
          {notice}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: {
    paddingBottom: 48,
    paddingHorizontal: gutter,
    paddingTop: topSpace,
  },
  back: { marginBottom: 24 },
  title: { ...type.title, color: colors.dark },
  intro: { ...type.body, color: colors.body, marginTop: 12 },
  note: {
    alignItems: "flex-start",
    backgroundColor: colors.primaryTint,
    borderRadius: radius.media,
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    padding: 16,
  },
  noteText: { ...type.small, color: colors.dark, flex: 1 },
  list: { marginTop: 16 },
  rowMuted: { opacity: 0.45 },
  spinner: { marginTop: 20 },
  notice: { ...type.small, color: colors.danger, marginTop: 16 },
});
