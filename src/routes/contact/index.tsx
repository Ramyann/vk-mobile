import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getFaqs, type FaqItem } from "../../api/content";
import { FaqAccordion } from "../../components/FaqAccordion";
import { submitContactInquiry, type ContactDraft } from "../../api/contact";
import { colors, radius } from "../../styles/tokens";
import { TurnstileSheet } from "../../components/TurnstileSheet";
import {
  LOCALE_OPTIONS,
  languageName,
  type AppLocale,
} from "../../i18n/locale";

function Back({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Go back"
      style={styles.back}
    >
      <Text style={styles.backText}>‹</Text>
    </Pressable>
  );
}

export function FaqScreen({
  onBack,
  locale,
}: {
  onBack: () => void;
  locale: AppLocale;
}) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    void getFaqs(locale)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [locale]);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Back onPress={onBack} />
      <Text style={styles.eyebrow}>PLAN YOUR VISIT</Text>
      <Text style={styles.title}>Frequently asked questions</Text>
      <Text style={styles.intro}>
        Helpful answers from the Visit Kurdistan team.
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : (
        <FaqAccordion items={items} />
      )}
    </ScrollView>
  );
}

export function LanguageScreen({
  locale,
  onBack,
  onSelect,
}: {
  locale: AppLocale;
  onBack: () => void;
  onSelect: (locale: AppLocale) => void;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Back onPress={onBack} />
      <Text style={styles.eyebrow}>PREFERENCES</Text>
      <Text style={styles.title}>Language</Text>
      <Text style={styles.intro}>
        Choose the language used for content, FAQs and the trip assistant.
      </Text>
      <View style={styles.languageList}>
        {LOCALE_OPTIONS.map((option) => (
          <Pressable
            key={option.code}
            onPress={() => onSelect(option.code)}
            style={[
              styles.languageOption,
              locale === option.code && styles.languageOptionActive,
            ]}
          >
            <View>
              <Text
                style={[
                  styles.languageTitle,
                  locale === option.code && styles.languageTitleActive,
                ]}
              >
                {option.nativeLabel}
              </Text>
              <Text
                style={[
                  styles.languageSubtitle,
                  locale === option.code && styles.languageSubtitleActive,
                ]}
              >
                {option.label}
              </Text>
            </View>
            <Text
              style={[
                styles.languageCheck,
                locale === option.code && styles.languageCheckActive,
              ]}
            >
              {locale === option.code ? "✓" : ""}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.languageCurrent}>
        Current language: {languageName(locale)}
      </Text>
    </ScrollView>
  );
}

const emptyDraft: ContactDraft = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactScreen({ onBack }: { onBack: () => void }) {
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft);
  const [verify, setVerify] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const set = (key: keyof ContactDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const start = () => {
    if (Object.values(draft).some((value) => !value.trim()))
      return setNotice("Please complete all fields.");
    setNotice(null);
    setVerify(true);
  };
  const submit = async (token: string) => {
    setVerify(false);
    setSending(true);
    try {
      await submitContactInquiry(draft, token);
      setDraft(emptyDraft);
      setNotice("Thanks — your message has been sent.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "We could not send your message.",
      );
    } finally {
      setSending(false);
    }
  };
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Back onPress={onBack} />
      <Text style={styles.eyebrow}>GET IN TOUCH</Text>
      <Text style={styles.title}>Contact us</Text>
      <Text style={styles.intro}>
        Send a message directly to the Visit Kurdistan team.
      </Text>
      <View style={styles.nameRow}>
        <Field
          label="First name"
          value={draft.firstName}
          onChangeText={(value) => set("firstName", value)}
        />
        <Field
          label="Last name"
          value={draft.lastName}
          onChangeText={(value) => set("lastName", value)}
        />
      </View>
      <Field
        label="Email"
        value={draft.email}
        keyboardType="email-address"
        onChangeText={(value) => set("email", value)}
      />
      <Field
        label="Subject"
        value={draft.subject}
        onChangeText={(value) => set("subject", value)}
      />
      <Field
        label="Message"
        multiline
        value={draft.message}
        onChangeText={(value) => set("message", value)}
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Pressable
        disabled={sending}
        onPress={start}
        style={[styles.primaryButton, sending && styles.disabled]}
      >
        {sending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Send message</Text>
        )}
      </Pressable>
      <TurnstileSheet
        visible={verify}
        onClose={() => setVerify(false)}
        onToken={(token) => void submit(token)}
      />
    </ScrollView>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        autoCapitalize={
          props.keyboardType === "email-address" ? "none" : "sentences"
        }
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.messageInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 44 },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    marginBottom: 14,
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  spinner: { marginTop: 28 },
  nameRow: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7 },
  label: { color: colors.dark, fontSize: 13, fontWeight: "800" },
  input: {
    backgroundColor: colors.soft,
    borderRadius: radius.input,
    color: colors.dark,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageInput: { minHeight: 130, textAlignVertical: "top" },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 52,
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  notice: { color: colors.primary, fontSize: 14, lineHeight: 20, marginTop: 8 },
  languageList: { gap: 10, marginTop: 8 },
  languageOption: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.card,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 74,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  languageOptionActive: { backgroundColor: colors.primary },
  languageTitle: { color: colors.dark, fontSize: 18, fontWeight: "800" },
  languageTitleActive: { color: colors.white },
  languageSubtitle: { color: colors.body, fontSize: 13, marginTop: 3 },
  languageSubtitleActive: { color: "rgba(255,255,255,0.8)" },
  languageCheck: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
    minWidth: 24,
    textAlign: "center",
  },
  languageCheckActive: { color: colors.lime },
  languageCurrent: { color: colors.body, fontSize: 13, marginTop: 8 },
});
