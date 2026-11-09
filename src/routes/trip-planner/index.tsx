import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "../../components/ui/Text";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContentItem, ContentType } from "../../api/content";
import { isInputBlocked } from "../../api/http";
import {
  createTripPlan,
  deleteTripPlan,
  getPlannerOptions,
  getTripPlan,
  isVerificationRequired,
  listTripPlans,
  parseTripRequest,
  slugFromHref,
  startPlannerSession,
  type TripPlan,
  type TripPlannerOptions,
  type TripRecommendation,
  type TripStop,
} from "../../api/trip-planner";
import { TurnstileSheet } from "../../components/TurnstileSheet";
import { WEBSITE_URL } from "../../config/environment";
import { isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { hasProhibitedInput } from "../../lib/input-safety";
import { formatNumber } from "../../lib/localized";
import type { AuthSession } from "../../lib/storage";
import {
  activeQuestions,
  addDays,
  applyArrival,
  applyCategory,
  applyDates,
  applyDestination,
  applyEvents,
  applyNotes,
  applyParsed,
  applyParty,
  applyTravelStyle,
  canBuild,
  confirmNoInterests,
  DATE_PRESETS,
  EMPTY_ANSWERS,
  isoDaysFromToday,
  MAX_INTERESTS,
  MAX_TRIP_DAYS,
  nextQuestion,
  rewindTo,
  routeDays,
  skipQuestion,
  tagsFor,
  toCreateInput,
  toggleInterest,
  type Answers,
  type QuestionId,
} from "../../lib/trip-planner-script";
import { colors, gutter, radius } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";
import { Button } from "../../components/ui/Button";
import { Chip as FilterChip } from "../../components/ui/Chip";
import { RoundAction, ScreenHeader } from "../../components/ui/ScreenHeader";

type T = ReturnType<typeof webT>;
type Mode =
  | { kind: "home" }
  | { kind: "chat" }
  | { kind: "plan"; token: string | null };

const OPENER_MAX = 600;
const NOTES_MAX = 400;

/** The website's "Feeling hungry?" / "somewhere to stay?" destinations. */
const ESSENTIALS = {
  food: "/discover/taste-of-kurdistan",
  stay: "/destinations?category=bb1bca97-c673-4b4a-a0f8-373b857ed098&tag=ab21b884-fa71-40da-8bbf-120e50ee0636",
} as const;

const websiteUrl = (locale: AppLocale, path: string) =>
  `${WEBSITE_URL}${locale === "en" ? "" : `/${locale}`}${path}`;

const shownDate = (value: string, locale: AppLocale) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(
    locale === "en" ? "en-GB" : "ar",
    { day: "numeric", month: "short" },
  );
};

const itemFromHref = (
  href: string,
  kind: ContentType,
  title: string,
  image?: string | null,
): ContentItem => {
  const slug = slugFromHref(href);
  return {
    id: slug,
    slug,
    type: kind,
    title,
    excerpt: "",
    image: image ?? null,
  };
};

export function TripPlannerScreen({
  locale,
  session,
  initialToken,
  onBack,
  onSignIn,
  onOpen,
  onOpenContact,
}: {
  locale: AppLocale;
  session: AuthSession | null;
  /** A shared trip opened from a link. */
  initialToken?: string | null;
  onBack: () => void;
  onSignIn: () => void;
  onOpen: (item: ContentItem) => void;
  onOpenContact: () => void;
}) {
  const t = webT(locale);
  const [mode, setMode] = useState<Mode>(
    initialToken ? { kind: "plan", token: initialToken } : { kind: "home" },
  );
  const [plan, setPlan] = useState<TripPlan | null>(null);

  if (!session)
    return (
      <Page
        locale={locale}
        onBack={onBack}
        title={t("exploreMap.ctaPrimaryLabel")}
      >
        <Intro t={t} />
        <View style={styles.card}>
          <Text style={styles.cardBody}>{t("auth.plannerNote")}</Text>
          <PrimaryButton
            label={t("header.account.signInOrCreate")}
            onPress={onSignIn}
          />
        </View>
      </Page>
    );

  if (mode.kind === "plan")
    return (
      <PlanView
        initialPlan={plan}
        locale={locale}
        onBack={() => {
          setPlan(null);
          setMode({ kind: "home" });
        }}
        onNewTrip={() => {
          setPlan(null);
          setMode({ kind: "chat" });
        }}
        onOpen={onOpen}
        onOpenContact={onOpenContact}
        t={t}
        token={mode.token}
      />
    );

  if (mode.kind === "chat")
    return (
      <PlannerChat
        locale={locale}
        onBack={() => setMode({ kind: "home" })}
        onPlan={(created) => {
          setPlan(created);
          setMode({ kind: "plan", token: created.shareToken ?? null });
        }}
        t={t}
      />
    );

  return (
    <SavedTrips
      locale={locale}
      onBack={onBack}
      onNew={() => setMode({ kind: "chat" })}
      onOpenTrip={(token) => setMode({ kind: "plan", token })}
      t={t}
    />
  );
}

function Page({
  onBack,
  locale,
  title,
  progress,
  actions,
  children,
  scrollRef,
}: {
  onBack: () => void;
  locale: AppLocale;
  /** Shown beside the back button. */
  title?: string;
  /** Answered so far, as a caption and a bar under the header. */
  progress?: { done: number; total: number; label: string };
  actions?: ReactNode;
  children: ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const tabBarSpace = useTabBarSpace();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <ScreenHeader
        actions={
          progress ? (
            <Text style={styles.progressText}>{progress.label}</Text>
          ) : (
            actions
          )
        }
        onBack={onBack}
        rtl={isRtl(locale)}
        title={title}
      />
      {progress ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(
                  (progress.done / Math.max(progress.total, 1)) * 100,
                )}%`,
              },
            ]}
          />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef?.current?.scrollToEnd({ animated: true })
        }
        ref={scrollRef}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Intro({ t }: { t: T }) {
  return (
    <>
      <Text accessibilityRole="header" style={styles.title}>
        {t("tripPlanner.title")}
      </Text>
      <Text style={styles.intro}>{t("tripPlanner.intro")}</Text>
    </>
  );
}

function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      disabled={disabled}
      fill
      label={label}
      loading={busy}
      onPress={onPress}
    />
  );
}

/** A Quiet text action, e.g. "Skip this question". */
function QuietLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button kind="quiet" label={label} onPress={onPress} />;
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * A planner answer. With a hint it is the redesign's option card (icon,
 * title, one line); without one it is a filter chip.
 */
function Chip({
  label,
  hint,
  icon,
  onPress,
  active,
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  onPress: () => void;
  active?: boolean;
}) {
  if (!hint)
    return (
      <FilterChip label={label} onPress={onPress} selected={Boolean(active)} />
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        (active || pressed) && styles.optionActive,
      ]}
    >
      {icon ? <Ionicons color={colors.primary} name={icon} size={22} /> : null}
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{label}</Text>
        <Text style={styles.optionHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

function SavedTrips({
  locale,
  t,
  onBack,
  onNew,
  onOpenTrip,
}: {
  locale: AppLocale;
  t: T;
  onBack: () => void;
  onNew: () => void;
  onOpenTrip: (token: string) => void;
}) {
  const queryClient = useQueryClient();
  const trips = useQuery({ queryKey: ["trip-plans"], queryFn: listTripPlans });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const remove = async (token: string) => {
    setDeleteError(null);
    try {
      await deleteTripPlan(token);
      setConfirming(null);
      await queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
    } catch {
      setDeleteError(t("tripPlanner.saved.deleteFailed"));
    }
  };
  return (
    <Page
      locale={locale}
      onBack={onBack}
      title={t("exploreMap.ctaPrimaryLabel")}
    >
      <Intro t={t} />
      <PrimaryButton label={t("tripPlanner.newTrip")} onPress={onNew} />
      {trips.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : trips.error ? (
        <View style={styles.card}>
          <Text style={styles.cardBody}>{t("tripPlanner.saved.failed")}</Text>
          <Pressable onPress={() => void trips.refetch()}>
            <Text style={styles.link}>{t("tripPlanner.saved.retry")}</Text>
          </Pressable>
        </View>
      ) : trips.data?.length ? (
        <>
          <Text style={styles.sectionTitle}>
            {t("tripPlanner.saved.title")}
          </Text>
          <Text style={styles.sectionBody}>
            {t("tripPlanner.saved.subtitle")}
          </Text>
          {trips.data.map((trip) => (
            <View key={trip.shareToken} style={styles.savedTrip}>
              <Pressable
                accessibilityLabel={t("tripPlanner.saved.open")}
                accessibilityRole="button"
                onPress={() => onOpenTrip(trip.shareToken)}
                style={styles.savedCopy}
              >
                <Text style={styles.savedTitle}>{trip.title}</Text>
                <Text style={styles.savedMeta}>
                  {`${shownDate(trip.startDate, locale)} – ${shownDate(trip.endDate, locale)}, ${t(
                    "tripPlanner.saved.days",
                    { count: formatNumber(trip.dayCount, locale) },
                  )}`}
                </Text>
              </Pressable>
              {confirming === trip.shareToken ? (
                <View style={styles.confirmRow}>
                  <Pressable onPress={() => void remove(trip.shareToken)}>
                    <Text style={styles.danger}>
                      {t("tripPlanner.saved.confirmDelete")}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirming(null)}>
                    <Text style={styles.link}>
                      {t("tripPlanner.saved.cancel")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityLabel={t("tripPlanner.saved.deleteNamed", {
                    title: trip.title,
                  })}
                  hitSlop={8}
                  onPress={() => setConfirming(trip.shareToken)}
                >
                  <Ionicons
                    color={colors.muted}
                    name="trash-outline"
                    size={20}
                  />
                </Pressable>
              )}
            </View>
          ))}
          {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
        </>
      ) : null}
    </Page>
  );
}

function PlannerChat({
  locale,
  t,
  onBack,
  onPlan,
}: {
  locale: AppLocale;
  t: T;
  onBack: () => void;
  onPlan: (plan: TripPlan) => void;
}) {
  const options = useQuery({
    queryKey: ["trip-planner-options", locale],
    queryFn: () => getPlannerOptions(locale),
  });
  const [plannerSession, setPlannerSession] = useState<string | null>(null);
  // The website shows its security check straight away; so does the app.
  const [verifyOpen, setVerifyOpen] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [openerOpen, setOpenerOpen] = useState(true);
  const [openerText, setOpenerText] = useState("");
  const [reading, setReading] = useState(false);
  const [understood, setUnderstood] = useState<{
    filled: QuestionId[];
    unmatched: string[];
  } | null>(null);
  const [building, setBuilding] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const data = options.data ?? null;

  const verify = async (token?: string) => {
    setVerifying(true);
    setNotice(null);
    try {
      setPlannerSession(await startPlannerSession(token));
    } catch (cause) {
      setNotice(
        cause instanceof Error && cause.message
          ? cause.message
          : t("tripPlanner.security"),
      );
    } finally {
      setVerifying(false);
    }
  };

  /** A failed call either needs a fresh check, or says why it failed. */
  const handleError = (cause: unknown, fallback: string) => {
    if (isVerificationRequired(cause)) {
      setPlannerSession(null);
      setNotice(t("tripPlanner.security"));
    } else if (isInputBlocked(cause)) setNotice(t("tripPlanner.inputBlocked"));
    else
      setNotice(
        cause instanceof Error && cause.message ? cause.message : fallback,
      );
  };

  const readOpener = async () => {
    if (!plannerSession || !data || !openerText.trim()) return;
    if (hasProhibitedInput(openerText))
      return setNotice(t("tripPlanner.inputBlocked"));
    setReading(true);
    setNotice(null);
    try {
      const parsed = await parseTripRequest(
        plannerSession,
        openerText.trim(),
        locale,
      );
      const result = applyParsed(answers, parsed, data);
      setAnswers(result.answers);
      setUnderstood({ filled: result.filled, unmatched: parsed.unmatched });
      setOpenerOpen(false);
    } catch (cause) {
      handleError(cause, t("tripPlanner.opener.failed"));
    } finally {
      setReading(false);
    }
  };

  const build = async () => {
    if (!plannerSession) return;
    if (hasProhibitedInput(answers.notes))
      return setNotice(t("tripPlanner.inputBlocked"));
    setBuilding(true);
    setNotice(null);
    try {
      onPlan(
        await createTripPlan(plannerSession, toCreateInput(answers, locale)),
      );
    } catch (cause) {
      handleError(cause, t("tripPlanner.error"));
    } finally {
      setBuilding(false);
    }
  };

  if (options.isLoading)
    return (
      <Page
        locale={locale}
        onBack={onBack}
        title={t("exploreMap.ctaPrimaryLabel")}
      >
        <Intro t={t} />
        <ActivityIndicator color={colors.primary} style={styles.loading} />
        <Text style={styles.sectionBody}>{t("tripPlanner.loading")}</Text>
      </Page>
    );
  if (!data)
    return (
      <Page
        locale={locale}
        onBack={onBack}
        title={t("exploreMap.ctaPrimaryLabel")}
      >
        <Intro t={t} />
        <Text style={styles.error}>{t("tripPlanner.noOptions")}</Text>
      </Page>
    );

  if (!plannerSession)
    return (
      <Page
        locale={locale}
        onBack={onBack}
        title={t("exploreMap.ctaPrimaryLabel")}
      >
        <Intro t={t} />
        <View style={styles.card}>
          <Text style={styles.cardBody}>
            {notice ?? t("tripPlanner.security")}
          </Text>
          <PrimaryButton
            busy={verifying}
            label={t("tripPlanner.saved.retry")}
            onPress={() => setVerifyOpen(true)}
          />
        </View>
        <TurnstileSheet
          locale={locale}
          visible={verifyOpen && !verifying}
          onClose={() => setVerifyOpen(false)}
          onToken={(token) => {
            setVerifyOpen(false);
            void verify(token);
          }}
        />
      </Page>
    );

  const active = activeQuestions(answers, data);
  const current = openerOpen ? null : nextQuestion(answers, data);
  const done = active.filter(
    (id) => answers.answered.includes(id) || answers.skipped.includes(id),
  ).length;

  return (
    <Page
      locale={locale}
      onBack={onBack}
      progress={
        openerOpen
          ? undefined
          : {
              done,
              total: active.length,
              label: t("tripPlanner.chat.progress", {
                done: formatNumber(done, locale),
                total: formatNumber(active.length, locale),
              }),
            }
      }
      scrollRef={scrollRef}
      title={t("exploreMap.ctaPrimaryLabel")}
    >
      <Intro t={t} />
      {openerOpen ? (
        <View style={styles.assistant}>
          <Text style={styles.assistantText}>
            {t("tripPlanner.opener.prompt")}
          </Text>
          <TextInput
            accessibilityLabel={t("tripPlanner.opener.label")}
            maxLength={OPENER_MAX}
            multiline
            onChangeText={setOpenerText}
            placeholder={t("tripPlanner.opener.placeholder")}
            placeholderTextColor={colors.muted}
            style={[
              styles.textArea,
              hasProhibitedInput(openerText) && styles.invalid,
            ]}
            value={openerText}
          />
          {hasProhibitedInput(openerText) ? (
            <Text style={styles.error}>{t("tripPlanner.inputBlocked")}</Text>
          ) : null}
          <Text style={styles.small}>
            {t("tripPlanner.opener.examplesLabel")}
          </Text>
          <View style={styles.chips}>
            {(["family", "couple", "solo"] as const).map((key) => (
              <Chip
                key={key}
                label={t(`tripPlanner.opener.examples.${key}`)}
                onPress={() =>
                  setOpenerText(t(`tripPlanner.opener.examples.${key}`))
                }
              />
            ))}
          </View>
          <PrimaryButton
            busy={reading}
            disabled={!openerText.trim() || hasProhibitedInput(openerText)}
            label={t(
              reading
                ? "tripPlanner.opener.reading"
                : "tripPlanner.opener.submit",
            )}
            onPress={() => void readOpener()}
          />
          <QuietLink
            label={t("tripPlanner.opener.skip")}
            onPress={() => setOpenerOpen(false)}
          />
        </View>
      ) : null}

      {understood ? (
        <View style={styles.assistant}>
          <Text style={styles.assistantText}>
            {t("tripPlanner.opener.understood", {
              count: understood.filled.length,
            })}
          </Text>
          {understood.unmatched.length ? (
            <Text style={[styles.assistantText, styles.spaced]}>
              {t("tripPlanner.opener.unmatched", {
                items: understood.unmatched.join(", "),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!openerOpen
        ? active
            .filter(
              (id) =>
                answers.answered.includes(id) || answers.skipped.includes(id),
            )
            .map((id) => (
              <View key={id}>
                <View style={styles.assistant}>
                  <Text style={styles.assistantText}>{promptFor(id, t)}</Text>
                </View>
                {answers.skipped.includes(id) ? (
                  <Pressable
                    onPress={() =>
                      setAnswers((value) => ({
                        ...value,
                        skipped: value.skipped.filter((entry) => entry !== id),
                      }))
                    }
                    style={styles.answer}
                  >
                    <Text style={styles.answerText}>
                      {t("tripPlanner.chat.skipped")}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel={t("tripPlanner.chat.change", {
                      question: promptFor(id, t),
                    })}
                    onPress={() => setAnswers((value) => rewindTo(value, id))}
                    style={styles.answer}
                  >
                    <Text style={styles.answerText}>
                      {answerLabel(id, answers, data, t, locale)}
                    </Text>
                  </Pressable>
                )}
                {id === "interests" &&
                answers.answered.includes("interests") ? (
                  <InterestChips
                    answers={answers}
                    data={data}
                    onChange={setAnswers}
                    t={t}
                  />
                ) : null}
              </View>
            ))
        : null}

      {current ? (
        <View>
          <View style={styles.assistant}>
            <Text style={styles.assistantText}>{promptFor(current, t)}</Text>
          </View>
          <QuestionControl
            answers={answers}
            data={data}
            id={current}
            locale={locale}
            onChange={setAnswers}
            t={t}
          />
        </View>
      ) : null}

      {!openerOpen ? (
        <View style={styles.footer}>
          {canBuild(answers) ? (
            <>
              <Text style={styles.sectionBody}>
                {current
                  ? t("tripPlanner.chat.buildAnytime")
                  : t("tripPlanner.chat.ready")}
              </Text>
              <PrimaryButton
                busy={building}
                label={t(
                  building
                    ? "tripPlanner.chat.building"
                    : "tripPlanner.chat.build",
                )}
                onPress={() => void build()}
              />
            </>
          ) : null}
        </View>
      ) : null}
      {notice ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {notice}
        </Text>
      ) : null}
    </Page>
  );
}

function promptFor(id: QuestionId, t: T): string {
  return t(`tripPlanner.chat.${id}.prompt`);
}

function answerLabel(
  id: QuestionId,
  answers: Answers,
  data: TripPlannerOptions,
  t: T,
  locale: AppLocale,
): string {
  const named = (list: { id: string; name: string }[], value?: string) =>
    list.find((option) => option.id === value)?.name ?? "";
  switch (id) {
    case "dates":
      return t("tripPlanner.chat.dates.answer", {
        start: shownDate(answers.startDate, locale),
        end: shownDate(answers.endDate, locale),
        count: routeDays(answers),
      });
    case "travelStyle":
      return answers.travelStyle
        ? t(`tripPlanner.travelStyles.${answers.travelStyle}.label`)
        : "";
    case "destination":
      return answers.destinationId
        ? named(data.destinations, answers.destinationId)
        : t("tripPlanner.chat.destination.anywhere");
    case "travellerType": {
      if (!answers.travellerType) return "";
      const who = t(`tripPlanner.travellerTypes.${answers.travellerType}`);
      return answers.travellerType === "family" ||
        answers.travellerType === "friends"
        ? `${who}, ${t("tripPlanner.chat.groupSize.answer", {
            count: answers.groupSize ?? 0,
          })}`
        : who;
    }
    case "arrival":
      return answers.arrivalDestinationId
        ? named(data.arrivalDestinations, answers.arrivalDestinationId)
        : t("tripPlanner.chat.arrival.unsure");
    case "locationCategory":
      return named(data.locationCategories, answers.locationCategoryId);
    case "interests":
      return answers.recommendationTagIds.length
        ? tagsFor(answers, data)
            .filter((tag) => answers.recommendationTagIds.includes(tag.id))
            .map((tag) => tag.name)
            .join(", ")
        : t("tripPlanner.chat.interests.noPreference");
    case "events":
      return t(
        answers.includeEvents === false
          ? "tripPlanner.chat.events.no"
          : "tripPlanner.chat.events.yes",
      );
    case "notes":
      return answers.notes || t("tripPlanner.chat.notes.skipped");
  }
}

function InterestChips({
  answers,
  data,
  t,
  onChange,
}: {
  answers: Answers;
  data: TripPlannerOptions;
  t: T;
  onChange: (update: (value: Answers) => Answers) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tags = tagsFor(answers, data);
  const shown = expanded ? tags : tags.slice(0, 8);
  return (
    <View style={styles.control}>
      <View style={styles.chips}>
        {shown.map((tag) => (
          <Chip
            active={answers.recommendationTagIds.includes(tag.id)}
            key={tag.id}
            label={tag.name}
            onPress={() => onChange((value) => toggleInterest(value, tag.id))}
          />
        ))}
        {!expanded && tags.length > 8 ? (
          <Chip
            label={`+ ${t("tripPlanner.chat.interests.more", { n: tags.length - 8 })}`}
            onPress={() => setExpanded(true)}
          />
        ) : null}
      </View>
      <Text style={styles.small}>
        {t("tripPlanner.chat.interests.count", {
          count: answers.recommendationTagIds.length,
          max: MAX_INTERESTS,
        })}
      </Text>
    </View>
  );
}

function QuestionControl({
  id,
  answers,
  data,
  t,
  locale,
  onChange,
}: {
  id: QuestionId;
  answers: Answers;
  data: TripPlannerOptions;
  t: T;
  locale: AppLocale;
  onChange: (update: (value: Answers) => Answers) => void;
}) {
  const [start, setStart] = useState(isoDaysFromToday(7));
  const [days, setDays] = useState(5);
  const [party, setParty] = useState<"family" | "friends" | null>(null);
  const [size, setSize] = useState(3);
  const [notes, setNotes] = useState(answers.notes);
  const skip = (
    <QuietLink
      label={t("tripPlanner.chat.skipQuestion")}
      onPress={() => onChange((value) => skipQuestion(value, id))}
    />
  );

  if (id === "dates")
    return (
      <View style={styles.control}>
        <View style={styles.options}>
          {DATE_PRESETS.map((preset) => (
            <Chip
              icon="calendar-outline"
              hint={t("tripPlanner.chat.dates.presetNights", {
                count: preset.nights + 1,
              })}
              key={preset.value}
              label={t(`tripPlanner.chat.dates.presets.${preset.value}`)}
              onPress={() =>
                onChange((value) =>
                  applyDates(
                    value,
                    isoDaysFromToday(preset.startsIn),
                    isoDaysFromToday(preset.startsIn + preset.nights),
                  ),
                )
              }
            />
          ))}
        </View>
        <Text style={styles.small}>{t("tripPlanner.chat.dates.orPick")}</Text>
        <Stepper
          label={`${t("tripPlanner.startDate")}: ${shownDate(start, locale)}`}
          onMinus={() =>
            setStart((value) =>
              value > isoDaysFromToday(0) ? addDays(value, -1) : value,
            )
          }
          onPlus={() => setStart((value) => addDays(value, 1))}
        />
        <Stepper
          label={t("tripPlanner.chat.dates.length", { count: days })}
          onMinus={() => setDays((value) => Math.max(1, value - 1))}
          onPlus={() => setDays((value) => Math.min(MAX_TRIP_DAYS, value + 1))}
        />
        <PrimaryButton
          label={t("tripPlanner.chat.dates.confirm")}
          onPress={() =>
            onChange((value) =>
              applyDates(value, start, addDays(start, days - 1)),
            )
          }
        />
      </View>
    );

  if (id === "travelStyle")
    return (
      <View style={[styles.control, styles.options]}>
        {data.travelStyles.map((style) => (
          <Chip
            hint={t(`tripPlanner.travelStyles.${style}.hint`)}
            icon={
              style === "touring" ? "git-branch-outline" : "location-outline"
            }
            key={style}
            label={t(`tripPlanner.travelStyles.${style}.label`)}
            onPress={() => onChange((value) => applyTravelStyle(value, style))}
          />
        ))}
      </View>
    );

  if (id === "destination")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          {data.destinations.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              onPress={() =>
                onChange((value) => applyDestination(value, option.id))
              }
            />
          ))}
          <Chip
            label={t("tripPlanner.chat.destination.anywhere")}
            onPress={() => onChange((value) => applyDestination(value, ""))}
          />
        </View>
        {skip}
      </View>
    );

  if (id === "travellerType")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          {data.travellerTypes.map((type) => (
            <Chip
              active={party === type}
              key={type}
              label={t(`tripPlanner.travellerTypes.${type}`)}
              onPress={() =>
                type === "family" || type === "friends"
                  ? setParty(type)
                  : onChange((value) => applyParty(value, type))
              }
            />
          ))}
        </View>
        {party ? (
          <>
            <Text style={styles.small}>
              {t("tripPlanner.chat.groupSize.prompt")}
            </Text>
            <Stepper
              label={t("tripPlanner.chat.groupSize.answer", { count: size })}
              onMinus={() =>
                setSize((value) => Math.max(data.groupSize.min, value - 1))
              }
              onPlus={() =>
                setSize((value) => Math.min(data.groupSize.max, value + 1))
              }
            />
            <PrimaryButton
              label={t("tripPlanner.chat.groupSize.confirm")}
              onPress={() =>
                onChange((value) => applyParty(value, party, size))
              }
            />
          </>
        ) : null}
        {skip}
      </View>
    );

  if (id === "arrival")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          {data.arrivalDestinations.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              onPress={() =>
                onChange((value) => applyArrival(value, option.id))
              }
            />
          ))}
          <Chip
            label={t("tripPlanner.chat.arrival.unsure")}
            onPress={() => onChange((value) => applyArrival(value, ""))}
          />
        </View>
        {skip}
      </View>
    );

  if (id === "locationCategory")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          {data.locationCategories.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              onPress={() =>
                onChange((value) => applyCategory(value, option.id))
              }
            />
          ))}
        </View>
        {skip}
      </View>
    );

  if (id === "interests")
    return (
      <View>
        <InterestChips
          answers={answers}
          data={data}
          onChange={onChange}
          t={t}
        />
        <QuietLink
          label={t("tripPlanner.chat.interests.skip")}
          onPress={() => onChange(confirmNoInterests)}
        />
      </View>
    );

  if (id === "events")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          <Chip
            label={t("tripPlanner.chat.events.yes")}
            onPress={() => onChange((value) => applyEvents(value, true))}
          />
          <Chip
            label={t("tripPlanner.chat.events.no")}
            onPress={() => onChange((value) => applyEvents(value, false))}
          />
        </View>
        {skip}
      </View>
    );

  const blocked = hasProhibitedInput(notes);
  return (
    <View style={styles.control}>
      <TextInput
        accessibilityLabel={t("tripPlanner.chat.notes.label")}
        maxLength={NOTES_MAX}
        multiline
        onChangeText={setNotes}
        placeholder={t("tripPlanner.chat.notes.placeholder")}
        placeholderTextColor={colors.muted}
        style={[styles.textArea, blocked && styles.invalid]}
        value={notes}
      />
      {blocked ? (
        <Text style={styles.error}>{t("tripPlanner.inputBlocked")}</Text>
      ) : null}
      <PrimaryButton
        disabled={!notes.trim() || blocked}
        label={t("tripPlanner.chat.notes.send")}
        onPress={() => onChange((value) => applyNotes(value, notes))}
      />
      <QuietLink
        label={t("tripPlanner.chat.notes.skip")}
        onPress={() => onChange((value) => applyNotes(value, ""))}
      />
    </View>
  );
}

function Stepper({
  label,
  onMinus,
  onPlus,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityLabel="−"
        hitSlop={6}
        onPress={onMinus}
        style={styles.stepButton}
      >
        <Ionicons color={colors.primary} name="remove" size={18} />
      </Pressable>
      <Text style={styles.stepLabel}>{label}</Text>
      <Pressable
        accessibilityLabel="+"
        hitSlop={6}
        onPress={onPlus}
        style={styles.stepButton}
      >
        <Ionicons color={colors.primary} name="add" size={18} />
      </Pressable>
    </View>
  );
}

/** The website's "Why it fits" line: the planner's reason, else the tags. */
function whyItFits(stop: TripStop, t: T): string {
  if (stop.why) return stop.why;
  if (stop.tags.length) return stop.tags.slice(0, 2).join(", ");
  return stop.destination ?? t("tripPlanner.surprise");
}

function PlanView({
  token,
  initialPlan,
  locale,
  t,
  onBack,
  onNewTrip,
  onOpen,
  onOpenContact,
}: {
  token: string | null;
  initialPlan: TripPlan | null;
  locale: AppLocale;
  t: T;
  onBack: () => void;
  onNewTrip: () => void;
  onOpen: (item: ContentItem) => void;
  onOpenContact: () => void;
}) {
  const queryClient = useQueryClient();
  const loaded = useQuery({
    queryKey: ["trip-plan", token],
    queryFn: () => getTripPlan(token!),
    enabled: Boolean(token) && !initialPlan,
  });
  const plan = initialPlan ?? loaded.data ?? null;
  useEffect(() => {
    if (initialPlan)
      void queryClient.invalidateQueries({ queryKey: ["trip-plans"] });
  }, [initialPlan, queryClient]);
  const packages = useMemo(() => plan?.packages ?? [], [plan]);

  if (!plan)
    return (
      <Page
        locale={locale}
        onBack={onBack}
        title={t("exploreMap.ctaPrimaryLabel")}
      >
        {loaded.isLoading ? (
          <>
            <ActivityIndicator color={colors.primary} style={styles.loading} />
            <Text style={styles.sectionBody}>
              {t("tripPlanner.loadingSaved")}
            </Text>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("tripPlanner.savedGoneTitle")}
            </Text>
            <Text style={styles.cardBody}>
              {t("tripPlanner.savedGoneBody")}
            </Text>
            <PrimaryButton
              label={t("tripPlanner.newTrip")}
              onPress={onNewTrip}
            />
          </View>
        )}
      </Page>
    );

  const shareUrl = plan.shareToken
    ? websiteUrl(locale, `/plan-your-trip/${plan.shareToken}`)
    : null;
  const openRecommendation = (item: TripRecommendation) =>
    onOpen(itemFromHref(item.href, item.kind, item.name, item.image));

  return (
    <Page
      actions={
        shareUrl ? (
          <RoundAction
            label={t("exploreMap.share")}
            onPress={() =>
              void Share.share({ message: `${plan.title}\n${shareUrl}` })
            }
          >
            <Ionicons color={colors.primary} name="share-outline" size={20} />
          </RoundAction>
        ) : undefined
      }
      locale={locale}
      onBack={onBack}
    >
      <View style={styles.planHead}>
        <Text accessibilityRole="header" style={styles.title}>
          {plan.title}
        </Text>
        {plan.startDate && plan.endDate ? (
          <Text style={styles.dates}>
            {`${shownDate(plan.startDate, locale)} – ${shownDate(plan.endDate, locale)}, ${formatNumber(plan.days.length, locale)} ${t("tripPlanner.tripDays")}`}
          </Text>
        ) : null}
      </View>
      {plan.summary ? <Text style={styles.intro}>{plan.summary}</Text> : null}
      {!shareUrl ? (
        <Text style={styles.small}>{t("tripPlanner.share.notSaved")}</Text>
      ) : null}

      {plan.days.map((day, dayIndex) => {
        const before = plan.days
          .slice(0, dayIndex)
          .reduce((count, entry) => count + entry.stops.length, 0);
        return (
          <View key={day.day} style={styles.day}>
            <Text style={styles.dayLabel}>
              {`${t("tripPlanner.day")} ${formatNumber(day.day, locale)}`}
            </Text>
            {day.title ? (
              <Text style={styles.dayTitle}>{day.title}</Text>
            ) : null}
            {day.stops.length ? (
              day.stops.map((stop, index) => (
                <Pressable
                  accessibilityRole="button"
                  key={stop.id}
                  onPress={() =>
                    onOpen(
                      itemFromHref(stop.href, "place", stop.name, stop.image),
                    )
                  }
                  style={({ pressed }) => [
                    styles.stop,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rail}>
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>
                        {formatNumber(before + index + 1, locale)}
                      </Text>
                    </View>
                    {index < day.stops.length - 1 ? (
                      <View style={styles.railLine} />
                    ) : null}
                  </View>
                  <View style={styles.stopCopy}>
                    {stop.image ? (
                      <Image
                        source={{ uri: stop.image }}
                        style={styles.stopImage}
                      />
                    ) : (
                      <View style={[styles.stopImage, styles.stopFallback]} />
                    )}
                    <Text style={styles.stopTitle}>{stop.name}</Text>
                    {stop.destination ? (
                      <Text style={styles.stopMeta}>{stop.destination}</Text>
                    ) : null}
                    <Text style={styles.why}>
                      <Text style={styles.whyLabel}>
                        {`${t("tripPlanner.why")}: `}
                      </Text>
                      {whyItFits(stop, t)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.freeDay}>
                <Text style={styles.sectionBody}>
                  {day.summary || t("tripPlanner.noStops")}
                </Text>
              </View>
            )}
            {day.stops.length && day.summary ? (
              <Text style={styles.sectionBody}>{day.summary}</Text>
            ) : null}
          </View>
        );
      })}

      {packages.length ? (
        <>
          <Text style={styles.sectionTitle}>
            {packages.every((item) => item.close)
              ? t("tripPlanner.packages.closeTitle")
              : t("tripPlanner.packages.title")}
          </Text>
          {packages.map((item) => (
            <Recommendation
              item={item}
              key={item.id}
              locale={locale}
              onPress={() => openRecommendation(item)}
              t={t}
            />
          ))}
        </>
      ) : null}
      {plan.recommendations.length ? (
        <>
          <Text style={styles.sectionTitle}>
            {t("tripPlanner.recommendations")}
          </Text>
          {plan.recommendations.map((item) => (
            <Recommendation
              item={item}
              key={item.id}
              locale={locale}
              onPress={() => openRecommendation(item)}
              t={t}
            />
          ))}
        </>
      ) : null}

      {(["food", "stay"] as const).map((key) => (
        <View key={key} style={styles.card}>
          <Text style={styles.cardTitle}>
            {t(`tripPlanner.essentials.${key}.title`)}
          </Text>
          <Text style={styles.cardBody}>
            {t(`tripPlanner.essentials.${key}.body`)}
          </Text>
          <QuietLink
            label={t(`tripPlanner.essentials.${key}.cta`)}
            onPress={() =>
              void Linking.openURL(websiteUrl(locale, ESSENTIALS[key]))
            }
          />
        </View>
      ))}
      <View style={[styles.card, styles.limeCard]}>
        <Text style={styles.cardTitle}>{t("tripPlanner.contact.title")}</Text>
        <Text style={styles.cardBody}>{t("tripPlanner.contact.body")}</Text>
        <PrimaryButton
          label={t("tripPlanner.contact.cta")}
          onPress={onOpenContact}
        />
      </View>
      <Text style={styles.sectionBody}>{t("tripPlanner.anotherTrip")}</Text>
      <PrimaryButton label={t("tripPlanner.newTrip")} onPress={onNewTrip} />
    </Page>
  );
}

function Recommendation({
  item,
  locale,
  t,
  onPress,
}: {
  item: TripRecommendation;
  locale: AppLocale;
  t: T;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.recRow, pressed && styles.pressed]}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.recImage} />
      ) : (
        <View style={[styles.recImage, styles.stopFallback]} />
      )}
      <View style={styles.recCopy}>
        <Text style={styles.stopMeta}>
          {t(
            item.kind === "package"
              ? "tripPlanner.packages.kindPackage"
              : "tripPlanner.packages.kindEvent",
          )}
          {item.close ? `, ${t("tripPlanner.packages.closeBadge")}` : ""}
        </Text>
        <Text style={styles.stopTitle}>{item.name}</Text>
        <Text style={styles.stopMeta}>
          {[
            item.destination,
            item.date ? shownDate(item.date, locale) : undefined,
            item.nights
              ? t("tripPlanner.packages.nights", { count: item.nights })
              : undefined,
          ]
            .filter(Boolean)
            .join(", ")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: {
    gap: 14,
    paddingBottom: 48,
    paddingHorizontal: gutter,
    paddingTop: 24,
  },
  pressed: { opacity: 0.85 },
  progressText: { ...type.caption, color: colors.muted },
  progressTrack: {
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginHorizontal: gutter,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 4,
  },
  title: { ...type.title, color: colors.dark },
  intro: { ...type.body, color: colors.body },
  small: { ...type.caption, color: colors.muted },
  spaced: { marginTop: 8 },
  loading: { marginTop: 24 },
  error: { ...type.small, color: colors.danger },
  danger: { ...type.smallStrong, color: colors.danger },
  link: { ...type.button, color: colors.primary },
  sectionTitle: { ...type.section, color: colors.dark, marginTop: 16 },
  sectionBody: { ...type.body, color: colors.body },
  card: {
    backgroundColor: colors.soft,
    borderRadius: radius.media,
    gap: 10,
    padding: 18,
  },
  limeCard: { backgroundColor: colors.lime },
  cardTitle: { ...type.item, color: colors.dark },
  cardBody: { ...type.small, color: colors.body },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderRadius: 20,
    gap: 10,
    maxWidth: "92%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assistantText: { ...type.body, color: colors.dark },
  answer: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginTop: 14,
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  answerText: { ...type.body, color: colors.white },
  control: { gap: 12, marginTop: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  options: { gap: 10 },
  option: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  optionActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: 17,
    paddingVertical: 15,
  },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { ...type.item, color: colors.dark },
  optionHint: { ...type.small, color: colors.muted },
  textArea: {
    backgroundColor: colors.soft,
    borderColor: colors.soft,
    borderRadius: radius.input,
    borderWidth: 2,
    color: colors.dark,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 120,
    padding: 14,
    textAlignVertical: "top",
  },
  invalid: { borderColor: colors.danger },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 12,
    padding: 4,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  stepLabel: {
    ...type.bodyStrong,
    color: colors.dark,
    flex: 1,
    textAlign: "center",
  },
  footer: { gap: 10, marginTop: 8 },
  savedTrip: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  savedCopy: { flex: 1, gap: 3 },
  savedTitle: { ...type.item, color: colors.dark },
  savedMeta: { ...type.small, color: colors.muted },
  confirmRow: { alignItems: "center", flexDirection: "row", gap: 14 },
  planHead: { gap: 8 },
  dates: { ...type.smallStrong, color: colors.primary },
  day: { gap: 14, marginTop: 16 },
  dayLabel: { ...type.section, color: colors.dark },
  dayTitle: { ...type.bodyStrong, color: colors.body, marginTop: -6 },
  stop: { flexDirection: "row", gap: 14 },
  rail: { alignItems: "center", gap: 4, width: 28 },
  stopNumber: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  stopNumberText: { ...type.smallStrong, color: colors.white },
  railLine: { backgroundColor: colors.border, flex: 1, width: 2 },
  stopCopy: { flex: 1, gap: 8, paddingBottom: 12 },
  stopImage: {
    backgroundColor: colors.soft,
    borderRadius: 18,
    height: 150,
    width: "100%",
  },
  stopFallback: { backgroundColor: colors.primaryTint },
  stopTitle: { ...type.item, color: colors.dark },
  stopMeta: { ...type.small, color: colors.muted },
  why: { ...type.small, color: colors.body },
  whyLabel: { ...type.smallStrong, color: colors.teal },
  recRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
  },
  recImage: { borderRadius: radius.thumb, height: 76, width: 76 },
  recCopy: { flex: 1, gap: 3 },
  freeDay: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
});
