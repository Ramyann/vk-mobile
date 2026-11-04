import { saveAuthSession, type AuthSession } from "./storage";

type Listener = (session: AuthSession | null) => void;

let current: AuthSession | null = null;
const listeners = new Set<Listener>();

/**
 * The one place the signed-in session lives, so a token refresh inside an API
 * call reaches the screens (and secure storage) without threading callbacks.
 */
export const getAuthSession = () => current;

export async function setAuthSession(
  session: AuthSession | null,
  persist = true,
): Promise<void> {
  current = session;
  listeners.forEach((listener) => listener(session));
  if (persist) await saveAuthSession(session);
}

export function subscribeAuthSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
