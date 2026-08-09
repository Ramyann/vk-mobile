import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getChatHistory,
  getStarterQuestions,
  sendChatMessage,
  startConversation,
  type ChatMessage,
} from "../../api/chat";
import { type ContentItem, type ContentType } from "../../api/content";
import type { AppLocale } from "../../i18n/locale";
import {
  loadChatSession,
  saveChatSession,
  type ChatSession,
} from "../../lib/storage";
import { colors, radius } from "../../styles/tokens";
import { TurnstileSheet } from "../TurnstileSheet";

function contentFromSuggestion(suggestion: {
  title: string;
  url: string;
  type: string;
}): ContentItem | null {
  const typeBySuggestion: Record<string, ContentType> = {
    destination: "destination",
    location: "place",
    place: "place",
    event: "event",
    package: "package",
    story: "story",
  };
  const type = typeBySuggestion[suggestion.type.toLowerCase()];
  const slug = suggestion.url.split("?")[0].split("/").filter(Boolean).pop();
  return type && slug
    ? {
        id: slug,
        slug,
        type,
        title: suggestion.title,
        excerpt: "",
        image: null,
        label: suggestion.type,
      }
    : null;
}

export function ChatScreen({
  onBack,
  onOpenContent,
  locale,
}: {
  onBack: () => void;
  onOpenContent: (item: ContentItem) => void;
  locale: AppLocale;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    void getStarterQuestions(locale)
      .then((items) => setStarters(Array.isArray(items) ? items : []))
      .catch(() => setStarters([]));
    void loadChatSession().then(async (saved) => {
      if (!saved) return;
      try {
        setMessages(await getChatHistory(saved));
        setSession(saved);
      } catch {
        await saveChatSession(null);
      }
    });
  }, [locale]);

  const send = async (text: string, token?: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!session && !token) {
      setQueuedMessage(trimmed);
      setVerifyOpen(true);
      return;
    }
    setSending(true);
    setError(null);
    setInput("");
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: pendingId, role: "user", content: trimmed, pending: true },
    ]);
    try {
      const active = session ?? (await startConversation(token, locale));
      if (!session) {
        setSession(active);
        await saveChatSession(active);
      }
      const reply = await sendChatMessage(active, trimmed, locale);
      setMessages((current) => [
        ...current.map((message) =>
          message.id === pendingId ? { ...message, pending: false } : message,
        ),
        {
          id: reply.messageId,
          role: "assistant",
          content: reply.answer,
          suggestions: reply.suggestions ?? [],
        },
      ]);
    } catch (cause) {
      setMessages((current) =>
        current.filter((message) => message.id !== pendingId),
      );
      setInput(trimmed);
      setError(
        cause instanceof Error
          ? cause.message
          : "The assistant is unavailable right now.",
      );
    } finally {
      setSending(false);
    }
  };

  const onVerified = (token: string) => {
    if (!queuedMessage) return;
    setVerifyOpen(false);
    const message = queuedMessage;
    setQueuedMessage(null);
    void send(message, token);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>VISIT KURDISTAN</Text>
          <Text style={styles.title}>Trip assistant</Text>
        </View>
        {messages.length ? (
          <Pressable
            onPress={() => {
              void saveChatSession(null);
              setSession(null);
              setMessages([]);
            }}
            style={styles.clear}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.transcript}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
      >
        {!messages.length ? (
          <>
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>How can we help?</Text>
              <Text style={styles.welcomeBody}>
                Ask about places, events, travel ideas and planning your visit
                to Kurdistan.
              </Text>
            </View>
            <View style={styles.starters}>
              {starters.map((question) => (
                <Pressable
                  key={question}
                  onPress={() => void send(question)}
                  style={styles.starter}
                >
                  <Text style={styles.starterText}>{question}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.role === "user"
                ? styles.userBubble
                : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                message.role === "user" && styles.userBubbleText,
              ]}
            >
              {message.content}
            </Text>
            {message.suggestions?.map((suggestion) => {
              const content = contentFromSuggestion(suggestion);
              return content ? (
                <Pressable
                  key={suggestion.url}
                  onPress={() => onOpenContent(content)}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>
                    {suggestion.title} ↗
                  </Text>
                </Pressable>
              ) : (
                <View key={suggestion.url} style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{suggestion.title}</Text>
                </View>
              );
            })}
          </View>
        ))}
        {sending ? (
          <View style={styles.thinking}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.thinkingText}>Finding an answer…</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          editable={!sending}
          multiline
          onChangeText={setInput}
          placeholder="Ask about Kurdistan"
          placeholderTextColor={colors.muted}
          style={styles.composerInput}
          value={input}
        />
        <Pressable
          disabled={sending || !input.trim()}
          onPress={() => void send(input)}
          style={[
            styles.send,
            (!input.trim() || sending) && styles.sendDisabled,
          ]}
        >
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
      <TurnstileSheet
        visible={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onToken={onVerified}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  backText: { color: colors.primary, fontSize: 33, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: colors.dark, fontSize: 18, fontWeight: "900", marginTop: 2 },
  clear: { marginLeft: "auto", padding: 8 },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  transcript: { gap: 12, padding: 20, paddingBottom: 28 },
  welcome: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 22,
  },
  welcomeTitle: { color: colors.dark, fontSize: 25, fontWeight: "900" },
  welcomeBody: {
    color: colors.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  starters: { gap: 9 },
  starter: {
    borderColor: colors.primary,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 15,
  },
  starterText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  bubble: { borderRadius: 20, maxWidth: "88%", padding: 14 },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: colors.soft },
  bubbleText: { color: colors.dark, fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: colors.white },
  suggestion: {
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionText: { color: colors.dark, fontSize: 13, fontWeight: "800" },
  thinking: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  thinkingText: { color: colors.body, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  composer: {
    alignItems: "flex-end",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  composerInput: {
    backgroundColor: colors.soft,
    borderRadius: 22,
    color: colors.dark,
    flex: 1,
    fontSize: 15,
    maxHeight: 96,
    minHeight: 48,
    paddingHorizontal: 15,
    paddingTop: 13,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.white, fontSize: 25, fontWeight: "700" },
});
