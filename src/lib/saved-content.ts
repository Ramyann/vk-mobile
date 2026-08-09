import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ContentItem } from "../api/content";
import { cacheSavedItem, removeCachedDetail } from "./offline-content";

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

export async function addSavedContent(item: ContentItem): Promise<ContentItem> {
  return cacheSavedItem(item);
}

export async function removeSavedContent(item: ContentItem): Promise<void> {
  await removeCachedDetail(item);
}

export function mergeSavedContent(
  ...collections: ContentItem[][]
): ContentItem[] {
  const merged = new Map<string, ContentItem>();
  for (const collection of collections) {
    for (const item of collection) {
      const key = `${item.type}-${item.id}`;
      // Local copies win because they may have a downloaded image URI.
      if (!merged.has(key)) merged.set(key, item);
    }
  }
  return [...merged.values()];
}
