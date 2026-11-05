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
import { ta, type AppMessageKey } from "../../i18n/app-messages";

const copy: Record<
  ContentType,
  { title: AppMessageKey; empty: AppMessageKey }
> = {
  destination: { title: "destinations", empty: "emptyList" },
  place: { title: "placesToSee", empty: "emptyList" },
  event: { title: "events", empty: "noEvents" },
  package: { title: "travelPackages", empty: "emptyList" },
  story: { title: "storiesAndGuides", empty: "emptyList" },
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
        <LoadingState label={ta(locale, "loading")} />
      ) : error ? (
        <ErrorState
          locale={locale}
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
              {ta(locale, page.title)}
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
            <EmptyState
              title={ta(locale, "nothingHere")}
              detail={ta(locale, page.empty)}
            />
          }
          ListFooterComponent={
            hasNextPage ? (
              <Button
                fill
                kind="secondary"
                label={ta(locale, "loadMore")}
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
