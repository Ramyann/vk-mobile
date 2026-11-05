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
import { RoundAction } from "../../components/ui/ScreenHeader";
import { isRtl, navLabels, t, type AppLocale } from "../../i18n/locale";
import { foldForSearch } from "../../lib/localized";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { ta, type AppMessageKey } from "../../i18n/app-messages";
import { Rail } from "../../components/ui/Rail";

const FILTERS: Array<{ value: "all" | ContentType; label: AppMessageKey }> = [
  { value: "all", label: "all" },
  { value: "destination", label: "destinations" },
  { value: "place", label: "places" },
  { value: "event", label: "events" },
  { value: "package", label: "packages" },
  { value: "story", label: "stories" },
];

export function DiscoverScreen({
  onOpen,
  onOpenMap,
  locale,
}: {
  onOpen: (item: ContentItem) => void;
  onOpenMap: () => void;
  locale: AppLocale;
}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const tabBarSpace = useTabBarSpace();
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
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>
            {navLabels[locale].discover}
          </Text>
          <RoundAction label={ta(locale, "exploreTheMap")} onPress={onOpenMap}>
            <Ionicons color={colors.primary} name="map-outline" size={22} />
          </RoundAction>
        </View>
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
              accessibilityLabel={ta(locale, "clearSearch")}
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
        <Rail rtl={isRtl(locale)} contentContainerStyle={styles.chips}>
          {FILTERS.map((option) => (
            <Chip
              key={option.value}
              label={ta(locale, option.label)}
              selected={filter === option.value}
              onPress={() => setFilter(option.value)}
            />
          ))}
        </Rail>
      </View>
      {loading ? (
        <LoadingState label={ta(locale, "loading")} />
      ) : (
        <FlatList
          contentContainerStyle={[
            styles.results,
            { paddingBottom: tabBarSpace },
          ]}
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
              detail={ta(locale, "noResultsHint")}
              action={
                query || filter !== "all"
                  ? {
                      label: ta(locale, "clearSearch"),
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
    paddingTop: topSpace + 8,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
