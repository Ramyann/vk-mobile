import { API_URL } from "../config/environment";

export interface ContactDraft {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactInquiry(
  draft: ContactDraft,
  turnstileToken: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/forms/contact-inquiry`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...draft, turnstileToken }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    throw new Error(
      message || "We could not send your message. Please try again.",
    );
  }
}
