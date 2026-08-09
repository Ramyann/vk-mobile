import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { isAppLocale, type AppLocale } from "../i18n/locale";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  email: string;
  userType?: string;
  roles: string[];
}

export interface ChatSession {
  conversationId: string;
  sessionToken: string;
}

const AUTH_KEY = "vk-mobile-auth";
const CHAT_KEY = "vk-mobile-chat";
const LOCALE_KEY = "vk-mobile-locale";

async function readSecure<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeSecure(key: string, value: unknown | null): Promise<void> {
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export const loadAuthSession = () => readSecure<AuthSession>(AUTH_KEY);
export const saveAuthSession = (session: AuthSession | null) =>
  writeSecure(AUTH_KEY, session);
export const loadChatSession = () => readSecure<ChatSession>(CHAT_KEY);
export const saveChatSession = (session: ChatSession | null) =>
  writeSecure(CHAT_KEY, session);

export async function loadLocale(): Promise<AppLocale> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_KEY);
    return isAppLocale(saved) ? saved : "en";
  } catch {
    return "en";
  }
}

export const saveLocale = (locale: AppLocale) =>
  AsyncStorage.setItem(LOCALE_KEY, locale);
