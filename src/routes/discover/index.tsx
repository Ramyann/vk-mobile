import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getDiscoverData,
  type ContentItem,
  type ContentType,
} from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { Chip } from "../../components/ui/Chip";
import { navLabels, t, type AppLocale } from "../../i18n/locale";
import { foldForSearch } from "../../lib/localized";
import { colors, gutter, radius } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";

const FILTERS: Array<{ value: "all" | ContentType; label: string }> = [
  { value: "all", label: "All" },
  { value: "destination", label: "Destinations" },
  { value: "place", label: "Places" },
  { value: "event", label: "Events" },
  { value: "package", label: "Packages" },
  { value: "story", label: "Stories" },
];

export function DiscoverScreen({
  onOpen,
  locale,
}: {
  onOpen: (item: ContentItem) => void;
  locale: AppLocale;
}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<"all" | ContentType>("all");
  useEffect(() => {
    setLoading(true);
    void getDiscoverData(locale)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);
  const visible = useMemo(() => {
    const needle = foldForSearch(query);
    return items.filter(
      (item) =>
        (filter === "all" || item.type === filter) &&
        foldForSearch(
          `${item.title} ${item.excerpt} ${item.label ?? ""}`,
        ).includes(needle),
    );
  }, [filter, items, query]);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {navLabels[locale].discover}
        </Text>
        <View style={[styles.search, focused && styles.searchFocused]}>
          <Ionicons color={colors.muted} name="search-outline" size={20} />
          <TextInput
            accessibilityLabel={t(locale, "search")}
            value={query}
            onBlur={() => setFocused(false)}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            placeholder={t(locale, "searchPlaceholder")}
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            style={styles.input}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => setQuery("")}
            >
              <Ionicons color={colors.dark} name="close" size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={filter === option.value}
              onPress={() => setFilter(option.value)}
            />
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <LoadingState label="Loading the region…" />
      ) : (
        <FlatList
          contentContainerStyle={styles.results}
          data={visible}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <ContentCard
              divider={index > 0}
              item={item}
              locale={locale}
              variant="list"
              onPress={() => onOpen(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t(locale, "noResults")}
              detail="Try a destination, place, package, event or story by name."
              action={
                query || filter !== "all"
                  ? {
                      label: "Clear search",
                      onPress: () => {
                        setQuery("");
                        setFilter("all");
                      },
                    }
                  : undefined
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  header: {
    gap: 16,
    paddingBottom: 12,
    paddingHorizontal: gutter,
    paddingTop: 12,
  },
  title: { ...type.title, color: colors.dark },
  search: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
  },
  searchFocused: { borderColor: colors.primary },
  input: {
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    height: "100%",
  },
  chips: {
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: gutter,
    paddingTop: 4,
  },
  results: { flexGrow: 1, paddingHorizontal: gutter },
});
