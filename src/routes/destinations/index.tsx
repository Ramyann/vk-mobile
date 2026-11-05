import { FlatList, StyleSheet, Text, View } from "react-native";
import { type ContentItem, type ContentType } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { Button } from "../../components/ui/Button";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useContentList } from "../../hooks/useContentList";
import { isRtl, t, type AppLocale } from "../../i18n/locale";
import { colors, gutter } from "../../styles/tokens";
import { type } from "../../styles/typography";

const copy: Record<ContentType, { title: string; empty: string }> = {
  destination: {
    title: "Destinations",
    empty:
      "Destinations will appear here once they are added in the dashboard.",
  },
  place: {
    title: "Places to see",
    empty: "Places will appear here once they are added in the dashboard.",
  },
  event: { title: "Events", empty: "There are no upcoming events right now." },
  package: {
    title: "Travel packages",
    empty:
      "Travel packages will appear here once they are added in the dashboard.",
  },
  story: {
    title: "Stories & guides",
    empty: "Fresh stories and guides will appear here.",
  },
};

/** "See all" from Home: every item of one type, as Discover rows. */
export function BrowseScreen({
  type: contentType,
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
    useContentList(contentType, locale);
  const page = copy[contentType];
  return (
    <View style={styles.page}>
      <ScreenHeader onBack={onBack} rtl={isRtl(locale)} />
      {loading ? (
        <LoadingState label="Loading the region…" />
      ) : error ? (
        <ErrorState
          detail={t(locale, "connectionError")}
          onRetry={() => void refresh()}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.results}
          data={items}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text accessibilityRole="header" style={styles.title}>
              {page.title}
            </Text>
          }
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
            <EmptyState title="Nothing here yet" detail={page.empty} />
          }
          ListFooterComponent={
            hasNextPage ? (
              <Button
                fill
                kind="secondary"
                label="Load more"
                loading={loadingMore}
                onPress={() => void loadMore()}
                style={styles.more}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  results: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: gutter },
  title: {
    ...type.title,
    color: colors.dark,
    paddingBottom: 8,
    paddingTop: 16,
  },
  more: { marginTop: 16 },
});
