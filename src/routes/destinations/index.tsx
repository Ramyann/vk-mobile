import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { type ContentItem, type ContentType } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { useContentList } from "../../hooks/useContentList";
import type { AppLocale } from "../../i18n/locale";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { colors, radius } from "../../styles/tokens";
const copy: Record<
  ContentType,
  { eyebrow: string; title: string; empty: string }
> = {
  destination: {
    eyebrow: "WHERE TO GO",
    title: "Destinations",
    empty:
      "Destinations will appear here once they are added in the dashboard.",
  },
  place: {
    eyebrow: "WHERE TO GO",
    title: "Places to see",
    empty: "Places will appear here once they are added in the dashboard.",
  },
  event: {
    eyebrow: "PLAN YOUR VISIT",
    title: "Events",
    empty: "There are no upcoming events right now.",
  },
  package: {
    eyebrow: "WHERE TO GO",
    title: "Travel packages",
    empty:
      "Travel packages will appear here once they are added in the dashboard.",
  },
  story: {
    eyebrow: "TRAVEL IDEAS",
    title: "Stories & guides",
    empty: "Fresh stories and guides will appear here.",
  },
};
export function BrowseScreen({
  type,
  locale,
  onBack,
  onOpen,
}: {
  type: ContentType;
  locale: AppLocale;
  onBack: () => void;
  onOpen: (item: ContentItem) => void;
}) {
  const { items, loading, error, refresh, hasNextPage, loadingMore, loadMore } =
    useContentList(type, locale);
  const page = copy[type];
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>{page.eyebrow}</Text>
          <Text style={styles.title}>{page.title}</Text>
        </View>
      </View>
      {loading ? (
        <LoadingState label="Loading the region…" />
      ) : error ? (
        <ErrorState
          detail="Check your connection and try again."
          onRetry={() => void refresh()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.results}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              item={item}
              variant="list"
              onPress={() => onOpen(item)}
            />
          ))}
          {hasNextPage ? (
            <Pressable
              disabled={loadingMore}
              onPress={() => void loadMore()}
              style={styles.loadMore}
            >
              <Text style={styles.loadMoreText}>
                {loadingMore ? "Loading…" : "Load more"}
              </Text>
            </Pressable>
          ) : null}
          {!items.length ? (
            <EmptyState title="Nothing here yet" detail={page.empty} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 13,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 37 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 3,
  },
  results: { padding: 20, paddingTop: 2 },
  loadMore: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
  },
  loadMoreText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
});
