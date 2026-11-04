import { fetch as streamingFetch } from "expo/fetch";
import { API_URL } from "../config/environment";
import type { AppLocale } from "../i18n/locale";
import type { ChatSession } from "../lib/storage";
import { apiErrorFrom, unwrapData } from "./http";

export type ChatHandoff = "none" | "contact" | "faq";
export type ChatSuggestion = {
  title: string;
  url: string;
  type: string;
  /** False when the assistant mentioned something that has no page yet. */
  linkable?: boolean;
};
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  /** True while the reply is still arriving word by word. */
  streaming?: boolean;
  suggestions?: ChatSuggestion[];
  handoff?: ChatHandoff;
  feedback?: "up" | "down" | null;
};
export type ChatReply = {
  messageId: string;
  answer: string;
  suggestions: ChatSuggestion[];
  handoff: ChatHandoff;
};

const FALLBACK = "The assistant is unavailable right now.";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });
  if (!response.ok) throw await apiErrorFrom(response, FALLBACK);
  return unwrapData<T>(await response.json());
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

export const sendFeedback = (
  session: ChatSession,
  messageId: string,
  value: "up" | "down",
) =>
  request<unknown>(`/chat/messages/${encodeURIComponent(messageId)}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Chat-Session": session.sessionToken,
    },
    body: JSON.stringify({ value }),
  });

const isReply = (value: unknown): value is ChatReply => {
  if (!value || typeof value !== "object") return false;
  const reply = value as Record<string, unknown>;
  return (
    typeof reply.messageId === "string" &&
    typeof reply.answer === "string" &&
    Array.isArray(reply.suggestions)
  );
};

const normaliseReply = (reply: ChatReply): ChatReply => ({
  ...reply,
  handoff:
    reply.handoff === "contact" || reply.handoff === "faq"
      ? reply.handoff
      : "none",
});

/** One SSE frame (the text between blank lines) as `{ event, data }`. */
export function parseSseFrame(
  frame: string,
): { event: string; data: unknown } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (!data.length) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

/**
 * Sends a message and reads the reply as it arrives. The server writes the
 * whole reply first and then paces it out word by word (`event: chunk`),
 * ending with `event: complete` — the authoritative answer. Any error comes
 * back as an ordinary JSON response before the stream starts. An API that
 * predates the stream route (404) gets the JSON endpoint instead.
 */
export async function sendChatMessage(
  session: ChatSession,
  message: string,
  locale: AppLocale,
  onText: (text: string) => void,
): Promise<ChatReply> {
  const base = `${API_URL}/chat/conversations/${session.conversationId}/messages`;
  const headers = {
    "Content-Type": "application/json",
    "X-Chat-Session": session.sessionToken,
  };
  const body = JSON.stringify({ message, locale });
  const response = await streamingFetch(`${base}/stream`, {
    method: "POST",
    headers: { ...headers, Accept: "text/event-stream" },
    body,
  });
  if (response.status === 404) {
    const reply = await request<ChatReply>(
      `/chat/conversations/${session.conversationId}/messages`,
      { method: "POST", headers, body },
    );
    if (!isReply(reply)) throw new Error(FALLBACK);
    return normaliseReply(reply);
  }
  if (!response.ok)
    throw await apiErrorFrom(response as unknown as Response, FALLBACK);
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    const reply = unwrapData<unknown>(await response.json());
    if (!isReply(reply)) throw new Error(FALLBACK);
    return normaliseReply(reply);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error(FALLBACK);
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let complete: ChatReply | null = null;
  const consume = (frame: string) => {
    const parsed = parseSseFrame(frame);
    if (!parsed) return;
    const payload = parsed.data as Record<string, unknown>;
    if (parsed.event === "chunk" && typeof payload?.text === "string") {
      text += payload.text;
      onText(text);
    } else if (parsed.event === "complete" && isReply(payload)) {
      complete = normaliseReply(payload);
    }
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    frames.forEach(consume);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
  if (!complete) throw new Error(FALLBACK);
  return complete;
}
