import { API_URL } from "../config/environment";
import { getAuthSession, setAuthSession } from "../lib/auth-store";
import type { AuthSession } from "../lib/storage";
import { ApiError, apiErrorFrom, unwrapData } from "./http";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function post<T>(
  path: string,
  body: unknown,
  fallback: string,
  headers: Record<string, string> = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw await apiErrorFrom(response, fallback);
  return unwrapData<T>(await response.json());
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

type PublicUser = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

/**
 * Visitor sign-in. The staff endpoint (`/auth/login`) now refuses visitor
 * accounts, so the app uses the public one, as the website does.
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  const result = await post<{
    accessToken?: string;
    refreshToken?: string;
    user?: PublicUser;
  }>(
    "/auth/public/login",
    { email: normaliseEmail(email), password },
    "Unable to sign in right now.",
  );
  if (!result.accessToken || !result.refreshToken)
    throw new Error("The sign-in response was incomplete.");
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    email: result.user?.email ?? normaliseEmail(email),
    userId: result.user?.id,
    firstName: result.user?.firstName,
    lastName: result.user?.lastName,
    roles: [],
  };
}

/** Creates a visitor account; the API emails a verification link. */
export const signup = (input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) =>
  post<{ status?: string; message?: string }>(
    "/auth/public/signup",
    {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normaliseEmail(input.email),
      password: input.password,
    },
    "We could not create your account.",
  );

export const resendVerification = (email: string) =>
  post<{ success: boolean }>(
    "/auth/public/resend-verification",
    { email: normaliseEmail(email) },
    "We could not send the email.",
  );

/** Always succeeds for a well-formed email, so it reveals nothing. */
export const forgotPassword = (email: string) =>
  post<{ success: boolean }>(
    "/auth/forgot-password",
    { email: normaliseEmail(email) },
    "We could not send the reset email.",
  );

export async function logout(refreshToken: string): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
  } catch {
    // Removing device credentials remains the correct local logout outcome.
  }
}

let refreshing: Promise<AuthSession | null> | null = null;

/**
 * Trades the refresh token for a new pair. The old refresh token is consumed,
 * so concurrent 401s share one refresh instead of racing each other.
 */
function refreshSession(session: AuthSession): Promise<AuthSession | null> {
  refreshing ??= (async () => {
    try {
      const tokens = await post<{
        accessToken?: string;
        refreshToken?: string;
      }>("/auth/tokens/refresh", undefined, "Your session has expired.", {
        Authorization: `Bearer ${session.refreshToken}`,
      });
      if (!tokens.accessToken || !tokens.refreshToken) return null;
      const next = {
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
      await setAuthSession(next);
      return next;
    } catch (error) {
      // Only a definite rejection signs the visitor out; offline keeps them in.
      if (error instanceof ApiError) await setAuthSession(null);
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export class SignInRequiredError extends Error {
  constructor() {
    super("Please sign in again to continue.");
    this.name = "SignInRequiredError";
  }
}

/**
 * A request as the signed-in visitor. Catalogue calls must stay anonymous —
 * a visitor token changes what some content endpoints return.
 */
export async function authorizedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const send = (session: AuthSession) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  const session = getAuthSession();
  if (!session) throw new SignInRequiredError();
  const response = await send(session);
  if (response.status !== 401) return response;
  const renewed = await refreshSession(session);
  if (!renewed) throw new SignInRequiredError();
  return send(renewed);
}

/** Changing the password revokes every session, this device's included. */
export async function changePassword(
  currentPassword: string,
  password: string,
): Promise<void> {
  const response = await authorizedFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, password }),
  });
  if (!response.ok)
    throw await apiErrorFrom(response, "We could not change your password.");
}

export async function getProfile(): Promise<PublicUser> {
  const response = await authorizedFetch("/auth/public/me");
  if (!response.ok)
    throw await apiErrorFrom(response, "We could not load your profile.");
  return unwrapData<PublicUser>(await response.json());
}
