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
import { Ionicons } from "@expo/vector-icons";
import {
  getChatHistory,
  getStarterQuestions,
  sendChatMessage,
  sendFeedback,
  startConversation,
  type ChatMessage,
  type ChatSuggestion,
} from "../../api/chat";
import { ApiError, isInputBlocked } from "../../api/http";
import { type ContentItem, type ContentType } from "../../api/content";
import type { AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { hasProhibitedInput } from "../../lib/input-safety";
import {
  loadChatSession,
  saveChatSession,
  type ChatSession,
} from "../../lib/storage";
import { colors, radius } from "../../styles/tokens";
import { TurnstileSheet } from "../TurnstileSheet";
import { ChatMarkdown } from "./ChatMarkdown";

const MAX_MESSAGE_LENGTH = 1000;
const TYPE_LABELS = new Set([
  "location",
  "destination",
  "event",
  "package",
  "story",
]);

const typeBySuggestion: Record<string, ContentType> = {
  destination: "destination",
  city: "destination",
  location: "place",
  place: "place",
  event: "event",
  package: "package",
  story: "story",
};

function contentFromSuggestion(suggestion: ChatSuggestion): ContentItem | null {
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
  onOpenContact,
  onOpenFaqs,
  locale,
}: {
  onBack: () => void;
  onOpenContent: (item: ContentItem) => void;
  onOpenContact: () => void;
  onOpenFaqs: () => void;
  locale: AppLocale;
}) {
  const t = webT(locale);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const blocked = hasProhibitedInput(input);

  useEffect(() => {
    void getStarterQuestions(locale)
      .then((items) => setStarters(Array.isArray(items) ? items : []))
      .catch(() => setStarters([]));
    void loadChatSession().then(async (saved) => {
      if (!saved) return;
      try {
        const history = await getChatHistory(saved);
        // A last question with no reply goes back in the box to resend.
        const last = history[history.length - 1];
        if (last?.role === "user") {
          setMessages(history.slice(0, -1));
          setInput(last.content);
          setError(t("chat.errors.unanswered"));
        } else setMessages(history);
        setSession(saved);
      } catch {
        await saveChatSession(null);
      }
    });
    // Restoring once per language change is intended; `t` follows `locale`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const errorText = (cause: unknown): string => {
    if (isInputBlocked(cause)) return t("chat.errors.inputBlocked");
    if (cause instanceof ApiError) {
      if (cause.status === 429)
        return cause.retryAfterSeconds
          ? t("chat.errors.rateLimitedWithWait", {
              wait: `${Math.ceil(cause.retryAfterSeconds / 60)} min`,
            })
          : cause.message || t("chat.errors.rateLimited");
      if (cause.status === 503) return t("chat.errors.unavailable");
      if (cause.status === 400 && /verification/i.test(cause.message))
        return t("chat.errors.verification");
    }
    return t("chat.errors.generic");
  };

  const send = async (text: string, token?: string) => {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed || sending) return;
    if (hasProhibitedInput(trimmed)) {
      setInput(trimmed);
      setError(t("chat.errors.inputBlocked"));
      return;
    }
    if (!session && !token) {
      setQueuedMessage(trimmed);
      setVerifyOpen(true);
      return;
    }
    setSending(true);
    setError(null);
    setInput("");
    const userId = `user-${Date.now()}`;
    const replyId = `reply-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: trimmed, pending: true },
    ]);
    try {
      let active = session;
      if (!active) {
        active = await startConversation(token, locale);
        setSession(active);
        await saveChatSession(active);
      }
      const reply = await sendChatMessage(active, trimmed, locale, (partial) =>
        setMessages((current) => {
          const rest = current.filter((message) => message.id !== replyId);
          return [
            ...rest,
            {
              id: replyId,
              role: "assistant",
              content: partial,
              streaming: true,
            },
          ];
        }),
      );
      setMessages((current) => [
        ...current
          .filter((message) => message.id !== replyId)
          .map((message) =>
            message.id === userId ? { ...message, pending: false } : message,
          ),
        {
          id: reply.messageId,
          role: "assistant",
          content: reply.answer,
          suggestions: reply.suggestions,
          handoff: reply.handoff,
        },
      ]);
    } catch (cause) {
      setMessages((current) =>
        current.filter(
          (message) => message.id !== userId && message.id !== replyId,
        ),
      );
      setInput(trimmed);
      setError(errorText(cause));
      // A closed or unknown conversation needs a fresh, verified one.
      if (cause instanceof ApiError && cause.status === 403) {
        setSession(null);
        void saveChatSession(null);
      }
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

  const rate = (message: ChatMessage, value: "up" | "down") => {
    if (!session || message.feedback) return;
    setMessages((current) =>
      current.map((entry) =>
        entry.id === message.id ? { ...entry, feedback: value } : entry,
      ),
    );
    void sendFeedback(session, message.id, value).catch(() => undefined);
  };

  const streaming = messages.some((message) => message.streaming);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityLabel={t("chat.close")}
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>VISIT KURDISTAN</Text>
          <Text style={styles.title}>{t("chat.title")}</Text>
        </View>
        {messages.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void saveChatSession(null);
              setSession(null);
              setMessages([]);
              setError(null);
            }}
            style={styles.clear}
          >
            <Text style={styles.clearText}>{t("chat.clear")}</Text>
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
        <Text style={styles.disclaimer}>{t("chat.disclaimer")}</Text>
        {!messages.length ? (
          <>
            <View style={styles.welcome}>
              <Text style={styles.welcomeBody}>{t("chat.emptyTitle")}</Text>
            </View>
            <View style={styles.starters}>
              {starters.map((question) => (
                <Pressable
                  accessibilityRole="button"
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
        {messages.map((message) => {
          const linked = (message.suggestions ?? []).filter(
            (suggestion) =>
              suggestion.linkable !== false &&
              contentFromSuggestion(suggestion),
          );
          const mentioned = (message.suggestions ?? []).filter(
            (suggestion) => !linked.includes(suggestion),
          );
          const assistant = message.role === "assistant";
          return (
            <View
              key={message.id}
              style={[
                styles.bubble,
                assistant ? styles.assistantBubble : styles.userBubble,
              ]}
            >
              {assistant ? (
                <ChatMarkdown text={message.content} />
              ) : (
                <Text style={[styles.bubbleText, styles.userBubbleText]}>
                  {message.content}
                </Text>
              )}
              {!message.streaming && linked.length ? (
                <View style={styles.suggestions}>
                  <Text style={styles.suggestionsTitle}>
                    {t("chat.suggestionsTitle")}
                  </Text>
                  {linked.map((suggestion) => (
                    <Pressable
                      accessibilityRole="link"
                      key={suggestion.url}
                      onPress={() => {
                        const content = contentFromSuggestion(suggestion);
                        if (content) onOpenContent(content);
                      }}
                      style={styles.suggestion}
                    >
                      {TYPE_LABELS.has(suggestion.type.toLowerCase()) ? (
                        <Text style={styles.suggestionType}>
                          {t(`chat.types.${suggestion.type.toLowerCase()}`)}
                        </Text>
                      ) : null}
                      <Text style={styles.suggestionText}>
                        {suggestion.title} ↗
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {!message.streaming && mentioned.length ? (
                <Text style={styles.mentioned}>
                  {t("chat.alsoMentioned")}:{" "}
                  {mentioned.map((suggestion) => suggestion.title).join(", ")}
                </Text>
              ) : null}
              {!message.streaming && message.handoff === "contact" ? (
                <Pressable onPress={onOpenContact} style={styles.handoff}>
                  <Text style={styles.handoffText}>
                    {t("tripPlanner.contact.cta")} ↗
                  </Text>
                </Pressable>
              ) : null}
              {!message.streaming && message.handoff === "faq" ? (
                <Pressable onPress={onOpenFaqs} style={styles.handoff}>
                  <Text style={styles.handoffText}>FAQ ↗</Text>
                </Pressable>
              ) : null}
              {assistant &&
              !message.streaming &&
              session &&
              !message.id.startsWith("reply-") ? (
                <View style={styles.feedback}>
                  {message.feedback ? (
                    <Text style={styles.feedbackThanks}>
                      {t("chat.feedbackThanks")}
                    </Text>
                  ) : (
                    (["up", "down"] as const).map((value) => (
                      <Pressable
                        accessibilityLabel={t(
                          value === "up"
                            ? "chat.feedbackUp"
                            : "chat.feedbackDown",
                        )}
                        accessibilityRole="button"
                        hitSlop={6}
                        key={value}
                        onPress={() => rate(message, value)}
                      >
                        <Ionicons
                          color={colors.muted}
                          name={
                            value === "up"
                              ? "thumbs-up-outline"
                              : "thumbs-down-outline"
                          }
                          size={16}
                        />
                      </Pressable>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
        {sending && !streaming ? (
          <View style={styles.thinking}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.thinkingText}>{t("chat.thinking")}…</Text>
          </View>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
      {blocked ? (
        <Text accessibilityRole="alert" style={styles.blocked}>
          {t("chat.errors.inputBlocked")}
        </Text>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel={t("chat.placeholder")}
          editable={!sending}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          onChangeText={setInput}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.muted}
          style={[styles.composerInput, blocked && styles.inputInvalid]}
          value={input}
        />
        <Pressable
          accessibilityLabel={t("chat.send")}
          accessibilityRole="button"
          disabled={sending || !input.trim() || blocked}
          onPress={() => void send(input)}
          style={[
            styles.send,
            (!input.trim() || sending || blocked) && styles.sendDisabled,
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
  headerCopy: { flexShrink: 1 },
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
  disclaimer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  welcome: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 22,
  },
  welcomeBody: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
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
  suggestions: { gap: 8, marginTop: 12 },
  suggestionsTitle: {
    color: colors.body,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  suggestion: {
    backgroundColor: colors.lime,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionType: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  suggestionText: { color: colors.dark, fontSize: 13, fontWeight: "800" },
  mentioned: {
    color: colors.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  handoff: {
    alignSelf: "flex-start",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  handoffText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  feedback: { flexDirection: "row", gap: 14, marginTop: 10 },
  feedbackThanks: { color: colors.muted, fontSize: 12 },
  thinking: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  thinkingText: { color: colors.body, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  blocked: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
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
    borderColor: "transparent",
    borderRadius: 22,
    borderWidth: 1,
    color: colors.dark,
    flex: 1,
    fontSize: 15,
    maxHeight: 96,
    minHeight: 48,
    paddingHorizontal: 15,
    paddingTop: 13,
  },
  inputInvalid: { borderColor: colors.danger },
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
