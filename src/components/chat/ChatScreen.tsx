import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "../ui/Text";
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
import { isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { hasProhibitedInput } from "../../lib/input-safety";
import {
  loadChatSession,
  saveChatSession,
  type ChatSession,
} from "../../lib/storage";
import { colors, gutter, radius } from "../../styles/tokens";
import { TurnstileSheet } from "../TurnstileSheet";
import { ChatMarkdown } from "./ChatMarkdown";
import { fonts, type } from "../../styles/typography";
import { Button } from "../ui/Button";
import { ScreenHeader } from "../ui/ScreenHeader";
import { ta } from "../../i18n/app-messages";

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
      <ScreenHeader
        onBack={onBack}
        rtl={isRtl(locale)}
        title={t("chat.title")}
        actions={
          messages.length ? (
            <Button
              kind="quiet"
              label={t("chat.clear")}
              onPress={() => {
                void saveChatSession(null);
                setSession(null);
                setMessages([]);
                setError(null);
              }}
            />
          ) : undefined
        }
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.transcript}
        // Follow the conversation; the welcome screen stays at the top.
        onContentSizeChange={() => {
          if (messages.length)
            scrollRef.current?.scrollToEnd({ animated: true });
        }}
        keyboardShouldPersistTaps="handled"
      >
        {!messages.length ? (
          <>
            <View style={styles.intro}>
              <View style={styles.badge}>
                <Ionicons color={colors.primary} name="sparkles" size={26} />
              </View>
              <Text accessibilityRole="header" style={styles.welcome}>
                {ta(locale, "assistantHeadline")}
              </Text>
              <Text style={styles.welcomeBody}>{t("chat.emptyTitle")}</Text>
            </View>
            <View style={styles.starters}>
              {starters.map((question, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={question}
                  onPress={() => void send(question)}
                  style={({ pressed }) => [
                    styles.starter,
                    pressed && styles.starterPressed,
                  ]}
                >
                  <View style={styles.starterIcon}>
                    <Ionicons
                      color={colors.primary}
                      name={STARTER_ICONS[index % STARTER_ICONS.length]}
                      size={20}
                    />
                  </View>
                  <Text style={styles.starterText}>{question}</Text>
                  <Ionicons
                    color={colors.muted}
                    name={isRtl(locale) ? "chevron-back" : "chevron-forward"}
                    size={18}
                  />
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
                      <View style={styles.suggestionCopy}>
                        {TYPE_LABELS.has(suggestion.type.toLowerCase()) ? (
                          <Text style={styles.suggestionType}>
                            {t(`chat.types.${suggestion.type.toLowerCase()}`)}
                          </Text>
                        ) : null}
                        <Text style={styles.suggestionText}>
                          {suggestion.title}
                        </Text>
                      </View>
                      <Ionicons
                        color={colors.dark}
                        name={
                          isRtl(locale) ? "chevron-back" : "chevron-forward"
                        }
                        size={18}
                      />
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
                <Button
                  kind="secondary"
                  label={t("tripPlanner.contact.cta")}
                  onPress={onOpenContact}
                  style={styles.handoff}
                />
              ) : null}
              {!message.streaming && message.handoff === "faq" ? (
                <Button
                  kind="secondary"
                  label={ta(locale, "faq")}
                  onPress={onOpenFaqs}
                  style={styles.handoff}
                />
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
                          size={18}
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
          <Ionicons color={colors.white} name="arrow-up" size={22} />
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>{t("chat.disclaimer")}</Text>
      <TurnstileSheet
        locale={locale}
        visible={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onToken={onVerified}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * Topic icons for the starter questions, in the order the chat API returns
 * them: visa, best season, an itinerary, mountains, heritage sites, festivals.
 */
const STARTER_ICONS: Array<React.ComponentProps<typeof Ionicons>["name"]> = [
  "document-text-outline",
  "sunny-outline",
  "map-outline",
  "trail-sign-outline",
  "library-outline",
  "musical-notes-outline",
];

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  transcript: {
    gap: 14,
    paddingBottom: 24,
    paddingHorizontal: gutter,
    paddingTop: 12,
  },
  disclaimer: {
    ...type.caption,
    color: colors.muted,
    paddingBottom: 8,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  intro: { gap: 10, paddingBottom: 8, paddingTop: 8 },
  badge: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    marginBottom: 6,
    width: 56,
  },
  welcome: { ...type.title, color: colors.dark },
  welcomeBody: { ...type.body, color: colors.body },
  starters: { gap: 10 },
  starter: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 20,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  starterIcon: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  starterPressed: { backgroundColor: colors.primaryTint },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  starterText: { ...type.bodyStrong, color: colors.dark, flex: 1 },
  bubble: { borderRadius: 20, maxWidth: "88%" },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    gap: 10,
    padding: 16,
  },
  bubbleText: { ...type.body, color: colors.dark },
  userBubbleText: { color: colors.white },
  suggestions: { gap: 8 },
  suggestionsTitle: { ...type.caption, color: colors.muted },
  suggestion: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.thumb,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionCopy: { flex: 1 },
  suggestionType: { ...type.caption, color: colors.primary },
  suggestionText: { ...type.smallStrong, color: colors.dark },
  mentioned: { ...type.small, color: colors.body },
  handoff: { height: 44 },
  feedback: { flexDirection: "row", gap: 16 },
  feedbackThanks: { ...type.caption, color: colors.muted },
  thinking: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  thinkingText: { ...type.small, color: colors.body },
  error: { ...type.small, color: colors.danger },
  blocked: {
    ...type.small,
    color: colors.danger,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  composerInput: {
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: 24,
    borderWidth: 2,
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingTop: 12,
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
});
