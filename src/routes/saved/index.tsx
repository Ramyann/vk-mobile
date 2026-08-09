import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { ContentItem } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import { colors, radius } from "../../styles/tokens";
export function SavedScreen({
  saved,
  onOpen,
  onDiscover,
}: {
  saved: ContentItem[];
  onOpen: (item: ContentItem) => void;
  onDiscover: () => void;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>YOUR JOURNEY</Text>
      <Text style={styles.title}>Saved places</Text>
      {saved.length ? (
        saved.map((item) => (
          <ContentCard
            key={`${item.type}-${item.id}`}
            item={item}
            variant="list"
            onPress={() => onOpen(item)}
          />
        ))
      ) : (
        <EmptyState
          title="Nothing saved yet"
          detail="Tap the bookmark on a place, event or story to keep it here."
        />
      )}
      {!saved.length ? (
        <Pressable style={styles.button} onPress={onDiscover}>
          <Text style={styles.buttonText}>Explore Kurdistan</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 118 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 39,
    marginBottom: 6,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 22,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
});
