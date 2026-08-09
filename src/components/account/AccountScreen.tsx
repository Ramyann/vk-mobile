import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { changePassword, login, logout } from "../../api/auth";
import type { AuthSession } from "../../lib/storage";
import { colors, radius } from "../../styles/tokens";

export function LoginScreen({
  onBack,
  onSignedIn,
}: {
  onBack: () => void;
  onSignedIn: (session: AuthSession) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password)
      return setError("Enter your email and password.");
    setLoading(true);
    setError(null);
    try {
      onSignedIn(await login(email, password));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Welcome back.</Text>
      <Text style={styles.intro}>
        Sign in with the Visit Kurdistan account you already use. Your device
        keeps the session securely.
      </Text>
      <Text style={styles.label}>Email address</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={email}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        autoComplete="password"
        onChangeText={setPassword}
        placeholder="Your password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        disabled={loading}
        onPress={() => void submit()}
        style={[styles.primaryButton, loading && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Sign in</Text>
        )}
      </Pressable>
      <Text style={styles.note}>
        New partner or internal accounts are created and approved through the
        existing Visit Kurdistan process.
      </Text>
    </ScrollView>
  );
}

export function ProfileScreen({
  session,
  onBack,
  onSignedOut,
  onChangePassword,
}: {
  session: AuthSession;
  onBack: () => void;
  onSignedOut: () => void;
  onChangePassword: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    await logout(session.refreshToken);
    onSignedOut();
  };
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {session.email[0]?.toUpperCase() ?? "V"}
          </Text>
        </View>
        <Text style={styles.email}>{session.email}</Text>
        <Text style={styles.type}>
          {session.roles.length
            ? session.roles.join(" · ")
            : (session.userType ?? "Visit Kurdistan account")}
        </Text>
      </View>
      <Text style={styles.intro}>
        Your saved places sync to your Visit Kurdistan account whenever you are
        connected. You can manage your password here.
      </Text>
      <Pressable onPress={onChangePassword} style={styles.passwordButton}>
        <Text style={styles.passwordButtonText}>Change password</Text>
      </Pressable>
      <Pressable
        disabled={busy}
        onPress={() => void signOut()}
        style={styles.signOut}
      >
        <Text style={styles.signOutText}>
          {busy ? "Signing out…" : "Sign out"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export function ChangePasswordScreen({
  session,
  onBack,
}: {
  session: AuthSession;
  onBack: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!currentPassword || !password || !confirmation)
      return setNotice("Complete every password field.");
    if (password !== confirmation)
      return setNotice("The new passwords do not match.");
    setLoading(true);
    setNotice(null);
    try {
      await changePassword(session, currentPassword, password);
      setNotice("Your password has been changed.");
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "We could not change your password.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
      <Text style={styles.title}>Change password</Text>
      <Text style={styles.intro}>
        Use a new password with at least eight characters, an uppercase letter,
        a lowercase letter, a number and a symbol.
      </Text>
      <PasswordField
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <PasswordField
        label="New password"
        value={password}
        onChangeText={setPassword}
      />
      <PasswordField
        label="Confirm new password"
        value={confirmation}
        onChangeText={setConfirmation}
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable
        disabled={loading}
        onPress={() => void submit()}
        style={[styles.primaryButton, loading && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Update password</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoComplete="password"
        onChangeText={onChangeText}
        secureTextEntry
        style={styles.input}
        value={value}
      />
    </>
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
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 7,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 23, marginTop: 14 },
  label: { color: colors.dark, fontSize: 13, fontWeight: "800", marginTop: 22 },
  input: {
    backgroundColor: colors.soft,
    borderRadius: radius.input,
    color: colors.dark,
    fontSize: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 54,
  },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.7 },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: "center",
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
  email: { color: colors.dark, fontSize: 17, fontWeight: "800", marginTop: 14 },
  type: { color: colors.body, fontSize: 13, marginTop: 5, textAlign: "center" },
  signOut: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 26,
    minHeight: 52,
  },
  passwordButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 52,
  },
  passwordButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  signOutText: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  notice: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 16,
  },
});
