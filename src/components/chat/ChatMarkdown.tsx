import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { parseChatMarkdown, type InlineRun } from "../../lib/chat-markdown";
import { colors } from "../../styles/tokens";

function Runs({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.bold ? (
          <Text key={index} style={styles.bold}>
            {run.text}
          </Text>
        ) : (
          <Fragment key={index}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <View style={styles.root}>
      {parseChatMarkdown(text).map((block, index) => {
        if (block.kind === "heading")
          return (
            <Text key={index} style={styles.heading}>
              <Runs runs={block.runs} />
            </Text>
          );
        if (block.kind === "paragraph")
          return (
            <Text key={index} style={styles.text}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex ? "\n" : null}
                  <Runs runs={line} />
                </Fragment>
              ))}
            </Text>
          );
        return (
          <View key={index} style={styles.list}>
            {block.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.item}>
                <Text style={styles.marker}>
                  {block.kind === "bullets"
                    ? "•"
                    : `${block.start + itemIndex}.`}
                </Text>
                <Text style={[styles.text, styles.itemText]}>
                  <Runs runs={item} />
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  text: { color: colors.dark, fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: "800" },
  heading: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  list: { gap: 4 },
  item: { flexDirection: "row", gap: 8 },
  marker: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    minWidth: 16,
  },
  itemText: { flex: 1 },
});
