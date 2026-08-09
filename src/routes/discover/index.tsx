import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getDiscoverData,
  type ContentItem,
  type ContentType,
} from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import type { AppLocale } from "../../i18n/locale";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { colors, radius } from "../../styles/tokens";

const filters = [
  "all",
  "destination",
  "place",
  "event",
  "package",
  "story",
] as const;
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
  const [filter, setFilter] = useState<"all" | ContentType>("all");
  useEffect(() => {
    setLoading(true);
    void getDiscoverData(locale)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === "all" || item.type === filter) &&
          `${item.title} ${item.excerpt} ${item.label ?? ""}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
      ),
    [filter, items, query],
  );
  return (
    <View style={styles.page}>
      <Text style={styles.greeting}>DISCOVER</Text>
      <Text style={styles.title}>Where will you go?</Text>
      <View style={styles.searchInput}>
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search places and stories"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
      </View>
      <View style={styles.chips}>
        {filters.map((type) => (
          <Pressable
            key={type}
            onPress={() => setFilter(type)}
            style={[styles.chip, filter === type && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                filter === type && styles.chipTextActive,
              ]}
            >
              {type === "all"
                ? "All"
                : `${type[0].toUpperCase()}${type.slice(1)}s`}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <LoadingState label="Loading the region…" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.results}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.count}>
            {visible.length
              ? `${visible.length} places to explore`
              : "No results found"}
          </Text>
          {visible.map((item) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              item={item}
              variant="list"
              onPress={() => onOpen(item)}
            />
          ))}
          {!visible.length ? (
            <EmptyState
              title="Try another search"
              detail="Search by a city, place, event or story title."
            />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1, paddingTop: 1 },
  greeting: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginTop: 22,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 39,
    marginHorizontal: 20,
    marginTop: 8,
  },
  searchInput: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.input,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 15,
  },
  searchGlyph: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  input: { color: colors.dark, flex: 1, fontSize: 15, paddingVertical: 15 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  chip: {
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.body, fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  results: { padding: 20, paddingTop: 2 },
  count: { color: colors.body, fontSize: 13, marginBottom: 12 },
});
