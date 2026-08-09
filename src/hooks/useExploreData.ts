import { useQuery } from "@tanstack/react-query";
import { getExploreData } from "../api/content";
import type { AppLocale } from "../i18n/locale";

export function useExploreData(locale: AppLocale) {
  const query = useQuery({
    queryKey: ["explore", locale],
    queryFn: () => getExploreData(locale),
  });
  return {
    data: query.data,
    loading: query.isLoading,
    refreshing: query.isRefetching,
    error: query.error,
    refresh: query.refetch,
  };
}
