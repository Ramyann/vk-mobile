import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ContentItem } from "../../api/content";
import { ContentCard } from "../ContentCard";
import { t, type AppLocale } from "../../i18n/locale";
import { colors, radius } from "../../styles/tokens";
import { useContentSearch } from "../../hooks/useContentSearch";
export function SearchSheet({
  visible,
  locale,
  onClose,
  onOpen,
}: {
  visible: boolean;
  locale: AppLocale;
  onClose: () => void;
  onOpen: (item: ContentItem) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useContentSearch(query, locale, visible);
  useEffect(() => {
    if (!visible) return;
    setQuery("");
  }, [locale, visible]);
  const matches = search.data ?? [];
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t(locale, "search")}</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel={t(locale, "closeSearch")}
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.glyph}>⌕</Text>
            <TextInput
              autoFocus
              onChangeText={setQuery}
              placeholder={t(locale, "searchPlaceholder")}
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={query}
            />
          </View>
          {search.isFetching ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.hint}>{t(locale, "searching")}</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.results}
              showsVerticalScrollIndicator={false}
            >
              {query.trim().length >= 2 ? (
                <Text style={styles.hint}>
                  {matches.length
                    ? `${matches.length} ${t(locale, "matchingResults")}`
                    : t(locale, "noResults")}
                </Text>
              ) : (
                <Text style={styles.hint}>{t(locale, "searchHint")}</Text>
              )}
              {query.trim().length >= 2
                ? matches.map((item) => (
                    <ContentCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      variant="list"
                      onPress={() => {
                        onOpen(item);
                        onClose();
                      }}
                    />
                  ))
                : null}
              {search.isError ? (
                <Text style={styles.error}>{t(locale, "connectionError")}</Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(26, 15, 44, 0.3)",
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "78%",
    paddingTop: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  close: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  closeText: { color: colors.primary, fontSize: 30, lineHeight: 33 },
  inputWrap: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.input,
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 18,
    paddingHorizontal: 15,
  },
  glyph: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  input: { color: colors.dark, flex: 1, fontSize: 15, paddingVertical: 15 },
  loading: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center" },
  hint: { color: colors.body, fontSize: 13, marginBottom: 12 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 8 },
  results: { padding: 20, paddingTop: 14 },
});
