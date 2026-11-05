import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ContentItem } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import { navLabels, type AppLocale } from "../../i18n/locale";
import { colors, gutter } from "../../styles/tokens";
import { type } from "../../styles/typography";

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
  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.title}>
        {navLabels[locale].saved}
      </Text>
      <FlatList
        contentContainerStyle={styles.list}
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
                accessibilityLabel={`Remove ${item.title} from saved`}
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
            title="Nothing saved yet"
            detail="Tap the heart on any place, event or story to keep it here, even offline."
            action={{
              label: "Start exploring",
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
    paddingTop: 12,
  },
  list: { flexGrow: 1, paddingBottom: 20, paddingHorizontal: gutter },
  heart: { padding: 4 },
});
