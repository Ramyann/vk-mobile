import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "../../components/ui/Text";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { getFaqs, type FaqItem } from "../../api/content";
import { FaqAccordion } from "../../components/FaqAccordion";
import { submitContactInquiry, type ContactDraft } from "../../api/contact";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { BackButton } from "../../components/ui/ScreenHeader";
import { TextField } from "../../components/ui/TextField";
import { TurnstileSheet } from "../../components/TurnstileSheet";
import {
  isRtl,
  LOCALE_OPTIONS,
  languageName,
  type AppLocale,
} from "../../i18n/locale";
import { ta } from "../../i18n/app-messages";
import { fonts, type } from "../../styles/typography";

function Back({ onPress, locale }: { onPress: () => void; locale: AppLocale }) {
  return (
    <View style={styles.back}>
      <BackButton
        label={ta(locale, "goBack")}
        onPress={onPress}
        rtl={isRtl(locale)}
      />
    </View>
  );
}

export function FaqScreen({
  onBack,
  locale,
}: {
  onBack: () => void;
  locale: AppLocale;
}) {
  const tabBarSpace = useTabBarSpace();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    setLoading(true);
    void getFaqs(locale)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [locale]);
  const needle = normalise(query);
  const shown = needle
    ? items.filter((item) =>
        normalise(`${item.question} ${item.answer}`).includes(needle),
      )
    : items;
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
      keyboardShouldPersistTaps="handled"
    >
      <Back locale={locale} onPress={onBack} />
      <Text accessibilityRole="header" style={styles.title}>
        {ta(locale, "faq")}
      </Text>
      <Text style={styles.intro}>{ta(locale, "faqIntro")}</Text>
      <View style={[styles.search, focused && styles.searchFocused]}>
        <Ionicons color={colors.muted} name="search-outline" size={20} />
        <TextInput
          accessibilityLabel={ta(locale, "faqSearch")}
          onBlur={() => setFocused(false)}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder={ta(locale, "faqSearch")}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel={ta(locale, "clearSearch")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setQuery("")}
          >
            <Ionicons color={colors.muted} name="close-circle" size={20} />
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : shown.length ? (
        <FaqAccordion items={shown} />
      ) : (
        <Text style={styles.noMatch}>
          {ta(locale, "faqNoMatch", { query: query.trim() })}
        </Text>
      )}
    </ScrollView>
  );
}

/** Case- and accent-insensitive text for matching, without HTML tags. */
const normalise = (text: string) =>
  text
    .replace(/<[^>]*>/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function LanguageScreen({
  locale,
  onBack,
  onSelect,
}: {
  locale: AppLocale;
  onBack: () => void;
  onSelect: (locale: AppLocale) => void;
}) {
  const tabBarSpace = useTabBarSpace();
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
    >
      <Back locale={locale} onPress={onBack} />
      <Text accessibilityRole="header" style={styles.title}>
        {ta(locale, "language")}
      </Text>
      <Text style={styles.intro}>{ta(locale, "languageIntro")}</Text>
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
            <View style={styles.languageCheck}>
              {locale === option.code ? (
                <Ionicons color={colors.primary} name="checkmark" size={22} />
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={styles.languageCurrent}>
        {ta(locale, "currentLanguage", { language: languageName(locale) })}
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

export function ContactScreen({
  onBack,
  locale,
}: {
  onBack: () => void;
  locale: AppLocale;
}) {
  const tabBarSpace = useTabBarSpace();
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft);
  const [verify, setVerify] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const set = (key: keyof ContactDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const start = () => {
    if (Object.values(draft).some((value) => !value.trim()))
      return setNotice(ta(locale, "completeAllFields"));
    setNotice(null);
    setVerify(true);
  };
  const submit = async (token: string) => {
    setVerify(false);
    setSending(true);
    try {
      await submitContactInquiry(draft, token);
      setDraft(emptyDraft);
      setNotice(ta(locale, "messageSent"));
    } catch {
      setNotice(ta(locale, "messageFailed"));
    } finally {
      setSending(false);
    }
  };
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
      keyboardShouldPersistTaps="handled"
    >
      <Back locale={locale} onPress={onBack} />
      <Text accessibilityRole="header" style={styles.title}>
        {ta(locale, "contactUs")}
      </Text>
      <Text style={styles.intro}>{ta(locale, "contactIntro")}</Text>
      <View style={styles.nameRow}>
        <Field
          label={ta(locale, "firstName")}
          placeholder={ta(locale, "placeholderFirstName")}
          value={draft.firstName}
          onChangeText={(value) => set("firstName", value)}
        />
        <Field
          label={ta(locale, "lastName")}
          placeholder={ta(locale, "placeholderLastName")}
          value={draft.lastName}
          onChangeText={(value) => set("lastName", value)}
        />
      </View>
      <Field
        label={ta(locale, "email")}
        placeholder={ta(locale, "placeholderEmail")}
        value={draft.email}
        keyboardType="email-address"
        onChangeText={(value) => set("email", value)}
      />
      <Field
        label={ta(locale, "subject")}
        placeholder={ta(locale, "placeholderSubject")}
        value={draft.subject}
        onChangeText={(value) => set("subject", value)}
      />
      <Field
        label={ta(locale, "message")}
        placeholder={ta(locale, "placeholderMessage")}
        multiline
        value={draft.message}
        onChangeText={(value) => set("message", value)}
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Button
        fill
        label={ta(locale, "sendMessage")}
        loading={sending}
        onPress={start}
        style={styles.send}
      />
      <TurnstileSheet
        locale={locale}
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
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={styles.field}>
      <TextField
        {...props}
        autoCapitalize={
          props.keyboardType === "email-address" ? "none" : "sentences"
        }
        label={label}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: {
    gap: 14,
    paddingBottom: 44,
    paddingHorizontal: gutter,
    paddingTop: topSpace,
  },
  back: { marginBottom: 12 },
  title: { ...type.title, color: colors.dark },
  intro: { ...type.body, color: colors.body, marginBottom: 8 },
  spinner: { marginTop: 28 },
  search: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    height: 52,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  searchFocused: { borderColor: colors.primary },
  searchInput: {
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    height: "100%",
  },
  noMatch: { ...type.body, color: colors.muted, marginTop: 12 },
  send: { marginTop: 8 },
  nameRow: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 7 },
  notice: { ...type.body, color: colors.primary },
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
  languageTitle: { fontFamily: fonts.bold, color: colors.dark, fontSize: 18 },
  languageTitleActive: { color: colors.white },
  languageSubtitle: {
    fontFamily: fonts.regular,
    color: colors.body,
    fontSize: 13,
    marginTop: 3,
  },
  languageSubtitleActive: { color: "rgba(255,255,255,0.8)" },
  languageCheck: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 24,
    minWidth: 24,
    textAlign: "center",
  },
  languageCheckActive: { color: colors.lime },
  languageCurrent: {
    fontFamily: fonts.regular,
    color: colors.body,
    fontSize: 13,
    marginTop: 8,
  },
});
