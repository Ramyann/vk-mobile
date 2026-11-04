import { useState, type ReactNode } from "react";
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
  changePassword,
  forgotPassword,
  login,
  logout,
  resendVerification,
  signup,
} from "../../api/auth";
import type { AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import type { AuthSession } from "../../lib/storage";
import { isStrongPassword, PASSWORD_RULES } from "../../lib/password";
import { colors, radius } from "../../styles/tokens";

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function AuthPage({
  onBack,
  eyebrow,
  title,
  intro,
  children,
}: {
  onBack: () => void;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={onBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure,
  locale,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  locale: AppLocale;
} & Pick<
  React.ComponentProps<typeof TextInput>,
  "autoComplete" | "keyboardType" | "autoCapitalize" | "textContentType"
>) {
  const t = webT(locale);
  const [hidden, setHidden] = useState(true);
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={secure ? "none" : input.autoCapitalize}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          secureTextEntry={secure && hidden}
          style={styles.input}
          value={value}
          {...input}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={
              hidden ? t("auth.showPassword") : t("auth.hidePassword")
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setHidden((current) => !current)}
            style={styles.eye}
          >
            <Ionicons
              color={colors.primary}
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

function PasswordRules({
  value,
  locale,
}: {
  value: string;
  locale: AppLocale;
}) {
  const t = webT(locale);
  return (
    <View style={styles.rules}>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <View
            accessibilityLabel={`${t(`auth.rules.${rule.id}`)}, ${t(
              met ? "auth.ruleMet" : "auth.ruleUnmet",
            )}`}
            key={rule.id}
            style={styles.rule}
          >
            <Ionicons
              color={met ? colors.teal : colors.muted}
              name={met ? "checkmark-circle" : "ellipse-outline"}
              size={16}
            />
            <Text style={[styles.ruleText, met && styles.ruleMet]}>
              {t(`auth.rules.${rule.id}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function PrimaryButton({
  label,
  busyLabel,
  busy,
  onPress,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={[styles.primaryButton, busy && styles.disabled]}
    >
      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.white} />
          <Text style={styles.primaryButtonText}>{busyLabel}</Text>
        </View>
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

function LinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export function LoginScreen({
  locale,
  note,
  onBack,
  onSignedIn,
  onSignup,
  onForgot,
}: {
  locale: AppLocale;
  /** Why sign-in is needed, e.g. the trip planner's note. */
  note?: string;
  onBack: () => void;
  onSignedIn: (session: AuthSession) => void;
  onSignup: () => void;
  onForgot: () => void;
}) {
  const t = webT(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError(t("auth.login.failed"));
    setLoading(true);
    setError(null);
    try {
      onSignedIn(await login(email, password));
    } catch (cause) {
      setError(messageOf(cause, t("auth.login.failed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPage
      onBack={onBack}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.login.panelTitle")}
      intro={note ?? t("auth.login.panelBody")}
    >
      <Field
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label={t("auth.emailLabel")}
        locale={locale}
        onChangeText={setEmail}
        textContentType="emailAddress"
        value={email}
      />
      <Field
        autoComplete="current-password"
        label={t("auth.passwordLabel")}
        locale={locale}
        onChangeText={setPassword}
        secure
        textContentType="password"
        value={password}
      />
      <LinkButton label={t("auth.login.forgot")} onPress={onForgot} />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton
        busy={loading}
        busyLabel={t("auth.login.submitting")}
        label={t("auth.login.submit")}
        onPress={() => void submit()}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{t("auth.login.newHere")}</Text>
        <LinkButton label={t("auth.login.createAccount")} onPress={onSignup} />
      </View>
    </AuthPage>
  );
}

export function SignupScreen({
  locale,
  onBack,
  onSignIn,
}: {
  locale: AppLocale;
  onBack: () => void;
  onSignIn: () => void;
}) {
  const t = webT(locale);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim())
      return setError(t("auth.signup.failed"));
    if (!isStrongPassword(password)) return setError(t("auth.weakPassword"));
    if (password !== confirmation) return setError(t("auth.passwordMismatch"));
    setLoading(true);
    setError(null);
    try {
      const result = await signup({ firstName, lastName, email, password });
      setDone(
        result.message?.includes("sign in now")
          ? result.message
          : t("auth.signup.checkEmail"),
      );
    } catch (cause) {
      setError(messageOf(cause, t("auth.signup.failed")));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await resendVerification(email);
      setResendNotice(t("auth.verify.resent"));
    } catch {
      setResendNotice(t("auth.verify.resendFailed"));
    }
  };

  if (done)
    return (
      <AuthPage
        onBack={onBack}
        eyebrow={t("auth.eyebrow")}
        title={t("auth.verify.panelTitle")}
        intro={done}
      >
        <PrimaryButton
          busy={false}
          busyLabel=""
          label={t("auth.signup.goToSignIn")}
          onPress={onSignIn}
        />
        <LinkButton
          label={t("auth.verify.resend")}
          onPress={() => void resend()}
        />
        {resendNotice ? (
          <Text style={styles.notice}>{resendNotice}</Text>
        ) : null}
      </AuthPage>
    );

  return (
    <AuthPage
      onBack={onBack}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.signup.title")}
      intro={t("auth.signup.panelBody")}
    >
      <Field
        autoComplete="given-name"
        label={t("auth.firstNameLabel")}
        locale={locale}
        onChangeText={setFirstName}
        textContentType="givenName"
        value={firstName}
      />
      <Field
        autoComplete="family-name"
        label={t("auth.lastNameLabel")}
        locale={locale}
        onChangeText={setLastName}
        textContentType="familyName"
        value={lastName}
      />
      <Field
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        label={t("auth.emailLabel")}
        locale={locale}
        onChangeText={setEmail}
        textContentType="emailAddress"
        value={email}
      />
      <Field
        autoComplete="new-password"
        label={t("auth.passwordLabel")}
        locale={locale}
        onChangeText={setPassword}
        secure
        textContentType="newPassword"
        value={password}
      />
      <PasswordRules locale={locale} value={password} />
      <Field
        autoComplete="new-password"
        label={t("auth.confirmPasswordLabel")}
        locale={locale}
        onChangeText={setConfirmation}
        secure
        textContentType="newPassword"
        value={confirmation}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton
        busy={loading}
        busyLabel={t("auth.signup.submitting")}
        label={t("auth.signup.submit")}
        onPress={() => void submit()}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{t("auth.signup.haveAccount")}</Text>
        <LinkButton label={t("auth.signup.signIn")} onPress={onSignIn} />
      </View>
    </AuthPage>
  );
}

export function ForgotPasswordScreen({
  locale,
  onBack,
}: {
  locale: AppLocale;
  onBack: () => void;
}) {
  const t = webT(locale);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!email.trim()) return setNotice(t("auth.forgot.failed"));
    setLoading(true);
    setNotice(null);
    try {
      await forgotPassword(email);
      setSent(true);
      setNotice(t("auth.forgot.sent"));
    } catch (cause) {
      setNotice(messageOf(cause, t("auth.forgot.failed")));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthPage
      onBack={onBack}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.forgot.title")}
      intro={t("auth.forgot.panelBody")}
    >
      {!sent ? (
        <>
          <Field
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label={t("auth.emailLabel")}
            locale={locale}
            onChangeText={setEmail}
            textContentType="emailAddress"
            value={email}
          />
          <PrimaryButton
            busy={loading}
            busyLabel={t("auth.forgot.submitting")}
            label={t("auth.forgot.submit")}
            onPress={() => void submit()}
          />
        </>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <LinkButton label={t("auth.backToSignIn")} onPress={onBack} />
    </AuthPage>
  );
}

export function ProfileScreen({
  session,
  locale,
  onBack,
  onSignedOut,
  onChangePassword,
}: {
  session: AuthSession;
  locale: AppLocale;
  onBack: () => void;
  onSignedOut: () => void;
  onChangePassword: () => void;
}) {
  const t = webT(locale);
  const [busy, setBusy] = useState(false);
  const name = [session.firstName, session.lastName].filter(Boolean).join(" ");
  const signOut = async () => {
    setBusy(true);
    await logout(session.refreshToken);
    onSignedOut();
  };
  return (
    <AuthPage
      onBack={onBack}
      eyebrow={t("header.account.menuLabel").toUpperCase()}
      title={name || session.email}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(name || session.email)[0]?.toUpperCase() ?? "V"}
          </Text>
        </View>
        <Text style={styles.email}>
          {t("header.account.signedInAs", { name: name || session.email })}
        </Text>
        {name ? <Text style={styles.type}>{session.email}</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onChangePassword}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>{t("auth.reset.title")}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void signOut()}
        style={styles.signOut}
      >
        <Text style={styles.signOutText}>
          {busy ? t("header.account.signingOut") : t("header.account.signOut")}
        </Text>
      </Pressable>
    </AuthPage>
  );
}

/**
 * The backend revokes every session once the password changes, so success
 * signs this device out too and the visitor logs in with the new password.
 */
export function ChangePasswordScreen({
  locale,
  onBack,
  onChanged,
}: {
  locale: AppLocale;
  onBack: () => void;
  onChanged: () => void;
}) {
  const t = webT(locale);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!currentPassword) return setNotice(t("auth.reset.failed"));
    if (!isStrongPassword(password)) return setNotice(t("auth.weakPassword"));
    if (password !== confirmation) return setNotice(t("auth.passwordMismatch"));
    setLoading(true);
    setNotice(null);
    try {
      await changePassword(currentPassword, password);
      onChanged();
    } catch (error) {
      setNotice(messageOf(error, t("auth.reset.failed")));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthPage
      onBack={onBack}
      eyebrow={t("auth.eyebrow")}
      title={t("auth.reset.title")}
      intro={t("auth.reset.panelBody")}
    >
      <Field
        autoComplete="current-password"
        label={t("auth.passwordLabel")}
        locale={locale}
        onChangeText={setCurrentPassword}
        secure
        textContentType="password"
        value={currentPassword}
      />
      <Field
        autoComplete="new-password"
        label={t("auth.newPasswordLabel")}
        locale={locale}
        onChangeText={setPassword}
        secure
        textContentType="newPassword"
        value={password}
      />
      <PasswordRules locale={locale} value={password} />
      <Field
        autoComplete="new-password"
        label={t("auth.confirmPasswordLabel")}
        locale={locale}
        onChangeText={setConfirmation}
        secure
        textContentType="newPassword"
        value={confirmation}
      />
      {notice ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {notice}
        </Text>
      ) : null}
      <PrimaryButton
        busy={loading}
        busyLabel={t("auth.reset.submitting")}
        label={t("auth.reset.submit")}
        onPress={() => void submit()}
      />
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    marginBottom: 30,
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    marginTop: 7,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 23, marginTop: 14 },
  label: { color: colors.dark, fontSize: 13, fontWeight: "800", marginTop: 20 },
  inputRow: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.input,
    flexDirection: "row",
    marginTop: 8,
  },
  input: {
    color: colors.dark,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  eye: { paddingHorizontal: 14 },
  rules: { gap: 6, marginTop: 12 },
  rule: { alignItems: "center", flexDirection: "row", gap: 8 },
  ruleText: { color: colors.body, fontSize: 13 },
  ruleMet: { color: colors.teal, fontWeight: "700" },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 54,
  },
  busyRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.7 },
  link: { alignSelf: "flex-start", paddingVertical: 12 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 10,
  },
  switchText: { color: colors.body, fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: 12 },
  notice: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    marginTop: 24,
    padding: 26,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  avatarText: { color: colors.primary, fontSize: 27, fontWeight: "900" },
  email: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },
  type: { color: colors.body, fontSize: 13, marginTop: 5, textAlign: "center" },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 52,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  signOut: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 52,
  },
  signOutText: { color: colors.primary, fontSize: 15, fontWeight: "800" },
});
