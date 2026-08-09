import { useQuery } from "@tanstack/react-query";
import {
  getContentDetail,
  type ContentDetail,
  type ContentItem,
} from "../api/content";
import type { AppLocale } from "../i18n/locale";

export function useContentDetail(item: ContentItem, locale: AppLocale) {
  const query = useQuery<ContentDetail>({
    queryKey: ["content-detail", item.type, item.slug || item.id, locale],
    queryFn: () => getContentDetail(item, locale),
  });
  return {
    detail: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
  };
}
