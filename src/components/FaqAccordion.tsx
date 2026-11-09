import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./ui/Text";
import type { FaqItem } from "../api/content";
import { colors, radius } from "../styles/tokens";
import { fonts } from "../styles/typography";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <View style={styles.list}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={() => setOpenId(open ? null : item.id)}
            style={styles.item}
          >
            <View style={styles.questionRow}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.symbol}>{open ? "−" : "+"}</Text>
            </View>
            {open ? <Text style={styles.answer}>{item.answer}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.input,
    borderWidth: 1,
    padding: 16,
  },
  questionRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  question: {
    fontFamily: fonts.bold,
    color: colors.dark,
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  symbol: {
    fontFamily: fonts.regular,
    color: colors.primary,
    fontSize: 25,
    lineHeight: 28,
  },
  answer: {
    fontFamily: fonts.regular,
    color: colors.body,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
});
