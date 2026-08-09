import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { languageName, type AppLocale } from "../../i18n/locale";
import { colors, radius } from "../../styles/tokens";

export function MoreScreen({
  onOpenChat,
  onOpenProfile,
  onOpenFaqs,
  onOpenContact,
  onOpenLanguage,
  onOpenNotifications,
  onOpenNearby,
  signedIn,
  locale,
}: {
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onOpenFaqs: () => void;
  onOpenContact: () => void;
  onOpenLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenNearby: () => void;
  signedIn: boolean;
  locale: AppLocale;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>VISIT KURDISTAN</Text>
      <Text style={styles.title}>Travel made simpler.</Text>
      <Pressable onPress={onOpenChat} style={styles.assistantCard}>
        <Text style={styles.spark}>✦</Text>
        <Text style={styles.assistantTitle}>Trip assistant</Text>
        <Text style={styles.assistantBody}>
          Ask practical questions and find relevant places, events and guides.
        </Text>
        <Text style={styles.assistantNote}>Start a conversation ↗</Text>
      </Pressable>
      <MenuRow
        icon="◉"
        title={signedIn ? "Your profile" : "Sign in"}
        subtitle={
          signedIn
            ? "Manage your device session"
            : "Use your existing Visit Kurdistan account"
        }
        onPress={onOpenProfile}
      />
      <MenuRow
        icon="ⓘ"
        title="Frequently asked questions"
        subtitle="Helpful travel guidance in the app"
        onPress={onOpenFaqs}
      />
      <MenuRow
        icon="✉"
        title="Contact Visit Kurdistan"
        subtitle="Send a message to the team"
        onPress={onOpenContact}
      />
      <MenuRow
        icon="⌖"
        title="Nearby places"
        subtitle="See places around you on a map"
        onPress={onOpenNearby}
      />
      <MenuRow
        icon="◌"
        title="Travel notifications"
        subtitle="Choose event reminders and updates"
        onPress={onOpenNotifications}
      />
      <MenuRow
        icon="◎"
        title="Language"
        subtitle={languageName(locale)}
        onPress={onOpenLanguage}
      />
    </ScrollView>
  );
}
function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.copy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 118 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 39,
  },
  assistantCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: 22,
    marginTop: 18,
    marginBottom: 10,
  },
  spark: { color: colors.primary, fontSize: 24 },
  assistantTitle: {
    color: colors.dark,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 7,
  },
  assistantBody: {
    color: colors.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  assistantNote: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
  },
  menuRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 13,
    paddingVertical: 17,
  },
  icon: { color: colors.primary, fontSize: 22, width: 28 },
  copy: { flex: 1 },
  menuTitle: { color: colors.dark, fontSize: 16, fontWeight: "800" },
  menuSubtitle: { color: colors.body, fontSize: 13, marginTop: 3 },
  arrow: { color: colors.primary, fontSize: 28 },
});
