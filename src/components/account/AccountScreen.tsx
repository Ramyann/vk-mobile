import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import { Ionicons } from "@expo/vector-icons";
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  resendVerification,
  signup,
} from "../../api/auth";
import { isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import type { AuthSession } from "../../lib/storage";
import { isStrongPassword, PASSWORD_RULES } from "../../lib/password";
import { colors, gutter, radius } from "../../styles/tokens";
import { type } from "../../styles/typography";
import { Button } from "../ui/Button";
import { MenuRow } from "../ui/MenuRow";
import { ScreenHeader } from "../ui/ScreenHeader";
import { TextField } from "../ui/TextField";
import { ta } from "../../i18n/app-messages";

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

function AuthPage({
  onBack,
  locale,
  header,
  title,
  intro,
  children,
}: {
  onBack: () => void;
  locale: AppLocale;
  /** Shown beside the back button, as on Account. */
  header?: string;
  title?: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <ScreenHeader onBack={onBack} rtl={isRtl(locale)} title={header} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  locale,
  ...props
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
  return (
    <TextField
      hideLabel={t("auth.hidePassword")}
      showLabel={t("auth.showPassword")}
      {...props}
    />
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
              name={met ? "checkmark" : "remove"}
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
    <Button
      accessibilityLabel={busy ? busyLabel : label}
      fill
      label={label}
      loading={busy}
      onPress={onPress}
    />
  );
}

function LinkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return <Button kind="quiet" label={label} onPress={onPress} />;
}

/** "New here? Create an account", centred under the main action. */
function SwitchRow({ text, children }: { text: string; children: ReactNode }) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchText}>{text}</Text>
      {children}
    </View>
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
      locale={locale}
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
      <SwitchRow text={t("auth.login.newHere")}>
        <LinkButton label={t("auth.login.createAccount")} onPress={onSignup} />
      </SwitchRow>
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
        locale={locale}
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
      locale={locale}
      title={t("auth.signup.title")}
      intro={t("auth.signup.panelBody")}
    >
      <View style={styles.nameRow}>
        <View style={styles.nameField}>
          <Field
            autoComplete="given-name"
            label={t("auth.firstNameLabel")}
            locale={locale}
            onChangeText={setFirstName}
            textContentType="givenName"
            value={firstName}
          />
        </View>
        <View style={styles.nameField}>
          <Field
            autoComplete="family-name"
            label={t("auth.lastNameLabel")}
            locale={locale}
            onChangeText={setLastName}
            textContentType="familyName"
            value={lastName}
          />
        </View>
      </View>
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
      <SwitchRow text={t("auth.signup.haveAccount")}>
        <LinkButton label={t("auth.signup.signIn")} onPress={onSignIn} />
      </SwitchRow>
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
      locale={locale}
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
  onOpenTrips,
  onOpenSaved,
  onOpenNotifications,
}: {
  session: AuthSession;
  locale: AppLocale;
  onBack: () => void;
  onSignedOut: () => void;
  onChangePassword: () => void;
  onOpenTrips: () => void;
  onOpenSaved: () => void;
  onOpenNotifications: () => void;
}) {
  const t = webT(locale);
  const rtl = isRtl(locale);
  const [busy, setBusy] = useState(false);
  const name = [session.firstName, session.lastName].filter(Boolean).join(" ");
  const signOut = async () => {
    setBusy(true);
    await logout(session.refreshToken);
    onSignedOut();
  };
  return (
    <AuthPage
      header={t("header.account.menuLabel")}
      locale={locale}
      onBack={onBack}
    >
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(name || session.email)[0]?.toUpperCase() ?? "V"}
          </Text>
        </View>
        <View style={styles.identityCopy}>
          <Text numberOfLines={1} style={styles.name}>
            {name || session.email}
          </Text>
          {name ? (
            <Text numberOfLines={1} style={styles.email}>
              {session.email}
            </Text>
          ) : null}
        </View>
      </View>
      <View>
        <MenuRow
          divider={false}
          icon="git-branch-outline"
          title={ta(locale, "savedTrips")}
          detail={ta(locale, "savedTripsDetail")}
          rtl={rtl}
          onPress={onOpenTrips}
        />
        <MenuRow
          icon="bookmark-outline"
          title={ta(locale, "savedPlaces")}
          rtl={rtl}
          onPress={onOpenSaved}
        />
        <MenuRow
          icon="key-outline"
          title={t("auth.reset.title")}
          rtl={rtl}
          onPress={onChangePassword}
        />
        <MenuRow
          icon="notifications-outline"
          title={ta(locale, "notifications")}
          rtl={rtl}
          onPress={onOpenNotifications}
        />
      </View>
      <Button
        fill
        kind="secondary"
        label={
          busy ? t("header.account.signingOut") : t("header.account.signOut")
        }
        loading={busy}
        onPress={() => void signOut()}
      />
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
      locale={locale}
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
  content: {
    gap: 18,
    paddingBottom: 48,
    paddingHorizontal: gutter,
    paddingTop: 24,
  },
  title: { ...type.title, color: colors.dark },
  intro: { ...type.body, color: colors.body },
  nameRow: { flexDirection: "row", gap: 12 },
  nameField: { flex: 1 },
  rules: { gap: 6, marginTop: -8 },
  rule: { alignItems: "center", flexDirection: "row", gap: 8 },
  ruleText: { ...type.small, color: colors.muted },
  ruleMet: { ...type.smallStrong, color: colors.teal },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
  },
  switchText: { ...type.small, color: colors.body },
  error: { ...type.small, color: colors.danger },
  notice: { ...type.body, color: colors.primary },
  identity: { alignItems: "center", flexDirection: "row", gap: 16 },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  avatarText: { ...type.section, color: colors.primary },
  identityCopy: { flex: 1, gap: 2 },
  name: { ...type.section, color: colors.dark },
  email: { ...type.small, color: colors.muted },
});
