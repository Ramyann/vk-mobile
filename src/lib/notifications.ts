import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerMobileDevice, unregisterMobileDevice } from "../api/mobile";
import type { ContentItem } from "../api/content";
import type { AppLocale } from "../i18n/locale";
import type { AuthSession } from "./storage";

const PUSH_TOKEN_KEY = "vk-mobile-expo-push-token";
const EVENT_REMINDER_KEY = "vk-mobile-event-reminders";

type ReminderMap = Record<string, string>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const keyFor = (item: ContentItem) => `${item.type}:${item.id}`;

async function reminderMap(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(EVENT_REMINDER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as ReminderMap) : {};
  } catch {
    return {};
  }
}

async function saveReminderMap(value: ReminderMap): Promise<void> {
  await AsyncStorage.setItem(EVENT_REMINDER_KEY, JSON.stringify(value));
}

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return extra?.eas?.projectId ?? null;
}

/**
 * Registers only after a visitor explicitly enables notifications. Push tokens
 * never leave the device for anonymous visitors.
 */
export async function enablePushNotifications(
  session: AuthSession,
  locale: AppLocale,
): Promise<string> {
  if (!Device.isDevice)
    throw new Error("Notifications need a physical phone or tablet.");
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient)
    throw new Error(
      "Install the internal app build to enable push notifications.",
    );

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("travel-updates", {
      name: "Travel updates",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission =
    existing.granted ||
    existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      ? existing
      : await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error("Notification permission was not granted on this device.");

  const id = projectId();
  if (!id) throw new Error("This app build is missing its Expo project ID.");
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id }))
    .data;
  await registerMobileDevice(session, {
    expoPushToken: token,
    platform: Platform.OS === "ios" ? "ios" : "android",
    locale,
  });
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
}

export async function disablePushNotifications(
  session: AuthSession,
): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token)
    await unregisterMobileDevice(session, token).catch(() => undefined);
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

/** Schedules a one-day-before reminder locally for a saved future event. */
export async function scheduleSavedEventReminder(
  item: ContentItem,
): Promise<void> {
  if (item.type !== "event" || !item.date) return;
  const eventAt = new Date(item.date);
  if (Number.isNaN(eventAt.getTime())) return;
  const reminderAt = new Date(eventAt.getTime() - 24 * 60 * 60 * 1000);
  if (reminderAt.getTime() <= Date.now()) return;

  const reminders = await reminderMap();
  const key = keyFor(item);
  if (reminders[key])
    await Notifications.cancelScheduledNotificationAsync(reminders[key]!);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Coming up tomorrow",
      body: item.title,
      data: { url: `visitkurdistan://content/event/${item.slug || item.id}` },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderAt,
    },
  });
  reminders[key] = identifier;
  await saveReminderMap(reminders);
}

export async function cancelSavedEventReminder(
  item: ContentItem,
): Promise<void> {
  const reminders = await reminderMap();
  const key = keyFor(item);
  if (reminders[key]) {
    await Notifications.cancelScheduledNotificationAsync(reminders[key]!);
    delete reminders[key];
    await saveReminderMap(reminders);
  }
}
