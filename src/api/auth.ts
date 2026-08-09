import type { AuthSession } from "../lib/storage";
import { API_URL } from "../config/environment";

type TokenPayload = {
  email?: string;
  type?: string;
  roles?: Array<{ name?: string }>;
};

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload)
    return (payload as { data: T }).data;
  return payload as T;
}

function tokenPayload(token: string): TokenPayload {
  try {
    const segment = token.split(".")[1];
    if (!segment) return {};
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(globalThis.atob(normalized)) as TokenPayload;
  } catch {
    return {};
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Invalid email or password."
        : "Unable to sign in right now.",
    );
  const tokens = unwrap<{ accessToken?: string; refreshToken?: string }>(
    await response.json(),
  );
  if (!tokens.accessToken || !tokens.refreshToken)
    throw new Error("The sign-in response was incomplete.");
  const identity = tokenPayload(tokens.accessToken);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    email: identity.email ?? email.trim().toLowerCase(),
    userType: identity.type,
    roles: Array.isArray(identity.roles)
      ? identity.roles
          .map((role) => role.name)
          .filter((role): role is string => Boolean(role))
      : [],
  };
}

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

export async function changePassword(
  session: AuthSession,
  currentPassword: string,
  password: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ currentPassword, password }),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your current password is incorrect."
        : "We could not change your password.",
    );
  }
}
