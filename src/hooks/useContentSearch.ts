import { useQuery } from "@tanstack/react-query";
import { searchContent } from "../api/content";
import type { AppLocale } from "../i18n/locale";
import { useDebouncedValue } from "./useDebouncedValue";

export function useContentSearch(
  input: string,
  locale: AppLocale,
  enabled = true,
) {
  const query = useDebouncedValue(input.trim(), 300);
  return useQuery({
    queryKey: ["content-search", locale, query],
    queryFn: () => searchContent(query, locale),
    enabled: enabled && query.length >= 2,
  });
}
