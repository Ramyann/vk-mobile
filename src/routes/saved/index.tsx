import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "../../components/ui/Text";
import { Ionicons } from "@expo/vector-icons";
import type { ContentItem } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import { navLabels, type AppLocale } from "../../i18n/locale";
import { colors, gutter, topSpace } from "../../styles/tokens";
import { type } from "../../styles/typography";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { ta } from "../../i18n/app-messages";

export function SavedScreen({
  saved,
  locale,
  onOpen,
  onRemove,
  onDiscover,
}: {
  saved: ContentItem[];
  locale: AppLocale;
  onOpen: (item: ContentItem) => void;
  onRemove: (item: ContentItem) => void;
  onDiscover: () => void;
}) {
  const tabBarSpace = useTabBarSpace();
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        {navLabels[locale].saved}
      </Text>
      <FlatList
        contentContainerStyle={[styles.list, { paddingBottom: tabBarSpace }]}
        data={saved}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ContentCard
            divider={index > 0}
            item={item}
            locale={locale}
            variant="list"
            onPress={() => onOpen(item)}
            trailing={
              <Pressable
                accessibilityLabel={ta(locale, "removeFromSavedNamed", {
                  title: item.title,
                })}
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => onRemove(item)}
                style={styles.heart}
              >
                <Ionicons color={colors.primary} name="heart" size={22} />
              </Pressable>
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title={ta(locale, "savedEmptyTitle")}
            detail={ta(locale, "savedEmptyBody")}
            action={{
              label: ta(locale, "startExploring"),
              onPress: onDiscover,
              kind: "primary",
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  title: {
    ...type.title,
    color: colors.dark,
    paddingBottom: 12,
    paddingHorizontal: gutter,
    paddingTop: topSpace + 8,
  },
  list: { flexGrow: 1, paddingBottom: 20, paddingHorizontal: gutter },
  heart: { padding: 4 },
});
