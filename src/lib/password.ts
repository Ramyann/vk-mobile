/**
 * Mirrors the website's `src/routes/auth/password.ts`, itself mirroring the
 * backend's PASSWORD_REGEX. It checks the narrower symbol set the signup
 * endpoint accepts, so a password that passes here passes every endpoint.
 */
export type PasswordRuleId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "symbol";

export const PASSWORD_RULES: Array<{
  id: PasswordRuleId;
  test: (value: string) => boolean;
}> = [
  { id: "length", test: (value) => value.length >= 8 },
  { id: "uppercase", test: (value) => /[A-Z]/.test(value) },
  { id: "lowercase", test: (value) => /[a-z]/.test(value) },
  { id: "number", test: (value) => /[0-9]/.test(value) },
  { id: "symbol", test: (value) => /[#?!@$%^&*-]/.test(value) },
];

export const isStrongPassword = (value: string) =>
  PASSWORD_RULES.every((rule) => rule.test(value));
