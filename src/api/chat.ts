import { API_URL } from "../config/environment";
import type { AppLocale } from "../i18n/locale";
import type { ChatSession } from "../lib/storage";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  suggestions?: ChatSuggestion[];
};
export type ChatSuggestion = { title: string; url: string; type: string };

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload)
    return (payload as { data: T }).data;
  return payload as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Please wait a moment before sending another message."
        : "The assistant is unavailable right now.",
    );
  return unwrap<T>(await response.json());
}

export const DEFAULT_STARTER_QUESTIONS = [
  "What are the best places to visit in Kurdistan?",
  "What events are happening soon?",
  "Help me plan a three-day trip.",
];

/** The dashboard endpoint may not exist on an older deployed API yet. */
export async function getStarterQuestions(
  locale: AppLocale = "en",
): Promise<string[]> {
  try {
    const questions = await request<string[]>(
      `/chat/starter-questions?locale=${locale}`,
    );
    return Array.isArray(questions) && questions.length
      ? questions
      : DEFAULT_STARTER_QUESTIONS;
  } catch {
    return DEFAULT_STARTER_QUESTIONS;
  }
}

export const startConversation = async (
  turnstileToken?: string,
  locale: AppLocale = "en",
): Promise<ChatSession> => {
  const started = await request<{ id?: string; sessionToken?: string }>(
    "/chat/conversations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        ...(turnstileToken ? { turnstileToken } : {}),
      }),
    },
  );
  if (!started.id || !started.sessionToken)
    throw new Error("The assistant could not start a conversation.");
  return { conversationId: started.id, sessionToken: started.sessionToken };
};

export const getChatHistory = (session: ChatSession) =>
  request<ChatMessage[]>(
    `/chat/conversations/${session.conversationId}/messages`,
    { headers: { "X-Chat-Session": session.sessionToken } },
  );

export const sendChatMessage = (
  session: ChatSession,
  message: string,
  locale: AppLocale = "en",
) =>
  request<{
    messageId: string;
    answer: string;
    suggestions?: ChatSuggestion[];
  }>(`/chat/conversations/${session.conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Chat-Session": session.sessionToken,
    },
    body: JSON.stringify({ message, locale }),
  });
