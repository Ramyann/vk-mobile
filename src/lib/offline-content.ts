import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import type { ContentDetail, ContentItem } from "../api/content";

const DETAILS_KEY = "vk-mobile-offline-details";
// Created on first use: the web preview has no document directory, and
// building one when this module loads would stop the app from starting there.
const mediaDirectory = () =>
  new Directory(Paths.document, "visit-kurdistan-offline");

type DetailCache = Record<string, ContentDetail>;

const keyFor = (item: Pick<ContentItem, "id" | "slug" | "type">) =>
  `${item.type}:${item.slug || item.id}`;

const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

const imageExtension = (url: string) => {
  const match = url.split("?")[0]?.match(/\.(jpe?g|png|webp|gif)$/i);
  return match ? `.${match[1]!.toLowerCase()}` : ".jpg";
};

async function loadDetails(): Promise<DetailCache> {
  try {
    const value = await AsyncStorage.getItem(DETAILS_KEY);
    const parsed = value ? JSON.parse(value) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as DetailCache)
      : {};
  } catch {
    return {};
  }
}

async function saveDetails(details: DetailCache): Promise<void> {
  await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(details));
}

/**
 * Saves a small CMS record and its hero image in the app documents directory.
 * The original URL is retained so a later sync can update it without uploading
 * device files to the API.
 */
export async function cacheSavedItem(item: ContentItem): Promise<ContentItem> {
  const source = item.remoteImage ?? item.image;
  if (!source || source.startsWith("file:") || Platform.OS === "web")
    return item;

  try {
    const directory = mediaDirectory();
    directory.create({ idempotent: true, intermediates: true });
    const target = new File(
      directory,
      `${safeName(keyFor(item))}${imageExtension(source)}`,
    );
    const local = await File.downloadFileAsync(source, target, {
      idempotent: true,
    });
    return { ...item, image: local.uri, remoteImage: source };
  } catch {
    // The saved record still works online if a network download is interrupted.
    return item;
  }
}

export async function cacheSavedDetail(
  item: ContentItem,
  detail: ContentDetail,
): Promise<ContentDetail> {
  const cachedItem = await cacheSavedItem(detail);
  const cached = { ...detail, ...cachedItem, remoteImage: detail.image };
  const details = await loadDetails();
  details[keyFor(item)] = cached;
  await saveDetails(details);
  return cached;
}

export async function loadCachedDetail(
  item: ContentItem,
): Promise<ContentDetail | null> {
  const details = await loadDetails();
  return details[keyFor(item)] ?? null;
}

export async function removeCachedDetail(item: ContentItem): Promise<void> {
  const details = await loadDetails();
  delete details[keyFor(item)];
  await saveDetails(details);
}
