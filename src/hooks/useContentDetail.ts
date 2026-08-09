import { useQuery } from "@tanstack/react-query";
import {
  getContentDetail,
  type ContentDetail,
  type ContentItem,
} from "../api/content";
import type { AppLocale } from "../i18n/locale";
import { cacheSavedDetail, loadCachedDetail } from "../lib/offline-content";

export function useContentDetail(
  item: ContentItem,
  locale: AppLocale,
  persistOffline = false,
) {
  const query = useQuery<ContentDetail>({
    queryKey: ["content-detail", item.type, item.slug || item.id, locale],
    queryFn: async () => {
      try {
        const detail = await getContentDetail(item, locale);
        return persistOffline ? cacheSavedDetail(item, detail) : detail;
      } catch (error) {
        const cached = await loadCachedDetail(item);
        if (cached) return cached;
        throw error;
      }
    },
  });
  return {
    detail: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
