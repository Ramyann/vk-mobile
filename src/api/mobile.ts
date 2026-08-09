import { API_URL } from "../config/environment";
import type { ContentItem } from "./content";
import type { AuthSession } from "../lib/storage";

export type NotificationPreferences = {
  enabled: boolean;
  contentUpdates: boolean;
  upcomingEvents: boolean;
  savedEventReminders: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: false,
  contentUpdates: true,
  upcomingEvents: true,
  savedEventReminders: true,
};

export type MobileState = {
  savedContent: ContentItem[];
  notificationPreferences: NotificationPreferences;
};

const unwrap = <T>(payload: unknown): T =>
  payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: T }).data
    : (payload as T);

async function mobileRequest<T>(
  session: AuthSession,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : "We could not sync your mobile preferences.",
    );
  }
  return unwrap<T>(await response.json());
}

export const getMobileState = (session: AuthSession) =>
  mobileRequest<MobileState>(session, "/mobile/me");

const syncItem = (item: ContentItem): ContentItem => ({
  ...item,
  // Local file paths must never be stored on the server or sent to another
  // device; the CMS URL remains the canonical image source for syncing.
  image: item.remoteImage ?? item.image,
  remoteImage: undefined,
});

export const replaceMobileSavedContent = (
  session: AuthSession,
  items: ContentItem[],
) =>
  mobileRequest<{ savedContent: ContentItem[] }>(
    session,
    "/mobile/me/saved-content",
    { method: "PUT", body: JSON.stringify({ items: items.map(syncItem) }) },
  );

export const updateNotificationPreferences = (
  session: AuthSession,
  preferences: Partial<NotificationPreferences>,
) =>
  mobileRequest<{ notificationPreferences: NotificationPreferences }>(
    session,
    "/mobile/me/notification-preferences",
    { method: "PUT", body: JSON.stringify(preferences) },
  );

export const registerMobileDevice = (
  session: AuthSession,
  device: {
    expoPushToken: string;
    platform: "ios" | "android";
    locale: string;
  },
) =>
  mobileRequest<{ id: string }>(session, "/mobile/devices", {
    method: "POST",
    body: JSON.stringify(device),
  });

export const unregisterMobileDevice = (
  session: AuthSession,
  expoPushToken: string,
) =>
  mobileRequest<{ success: boolean }>(session, "/mobile/devices", {
    method: "DELETE",
    body: JSON.stringify({ expoPushToken }),
  });
