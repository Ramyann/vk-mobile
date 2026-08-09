import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ContentItem } from "../api/content";

const SAVED_KEY = "vk-mobile-saved";

export async function loadSavedContent(): Promise<ContentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const saveSavedContent = (items: ContentItem[]) =>
  AsyncStorage.setItem(SAVED_KEY, JSON.stringify(items));
