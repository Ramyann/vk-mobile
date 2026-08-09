import { useInfiniteQuery } from "@tanstack/react-query";
import { getContentPage, type ContentType } from "../api/content";
import type { AppLocale } from "../i18n/locale";

export function useContentList(type: ContentType, locale: AppLocale) {
  const query = useInfiniteQuery({
    queryKey: ["content-list", type, locale],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getContentPage(type, locale, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
  return {
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch,
    hasNextPage: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
  };
}
