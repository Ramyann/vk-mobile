import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
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
import type { AppLocale } from "../../i18n/locale";
import { colors, radius } from "../../styles/tokens";

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
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const update = async (next: NotificationPreferences) => {
    if (!session) {
      setNotice(
        "Sign in first so your notification preferences can follow you to another device.",
      );
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
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not update notifications.",
      );
    } finally {
      setBusy(false);
    }
  };

  const Row = ({
    title,
    detail,
    value,
    setting,
  }: {
    title: string;
    detail: string;
    value: boolean;
    setting: keyof NotificationPreferences;
  }) => (
    <View
      style={[
        styles.row,
        !preferences.enabled && setting !== "enabled" && styles.rowMuted,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch
        disabled={busy || (setting !== "enabled" && !preferences.enabled)}
        onValueChange={(value) =>
          void update({ ...preferences, [setting]: value })
        }
        thumbColor={value ? colors.lime : colors.white}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>PREFERENCES</Text>
      <Text style={styles.title}>Travel notifications</Text>
      <Text style={styles.intro}>
        Choose the travel updates that are useful to you. You can change these
        at any time in the app or device settings.
      </Text>
      <View style={styles.card}>
        <Row
          title="Notifications"
          detail="Receive chosen updates on this device"
          value={preferences.enabled}
          setting="enabled"
        />
        <Row
          title="Upcoming events"
          detail="New and upcoming events in Kurdistan"
          value={preferences.upcomingEvents}
          setting="upcomingEvents"
        />
        <Row
          title="Content updates"
          detail="New stories, guides and destinations"
          value={preferences.contentUpdates}
          setting="contentUpdates"
        />
        <Row
          title="Saved event reminders"
          detail="A reminder the day before a saved event"
          value={preferences.savedEventReminders}
          setting="savedEventReminders"
        />
      </View>
      {busy ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    marginBottom: 30,
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    marginTop: 7,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 23, marginTop: 14 },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    marginTop: 24,
    paddingHorizontal: 18,
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 18,
  },
  rowMuted: { opacity: 0.5 },
  copy: { flex: 1 },
  rowTitle: { color: colors.dark, fontSize: 16, fontWeight: "800" },
  rowDetail: { color: colors.body, fontSize: 13, lineHeight: 18, marginTop: 4 },
  spinner: { marginTop: 20 },
  notice: { color: colors.danger, fontSize: 13, lineHeight: 20, marginTop: 18 },
});
