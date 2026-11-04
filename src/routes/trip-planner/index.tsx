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
  Text,
  TextInput,
  View,
} from "react-native";
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
import type { AppLocale } from "../../i18n/locale";
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
import { colors, radius } from "../../styles/tokens";

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
      <Page onBack={onBack} t={t}>
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
  t,
  children,
  scrollRef,
}: {
  onBack: () => void;
  t: T;
  children: ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.page}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef?.current?.scrollToEnd({ animated: true })
        }
        ref={scrollRef}
      >
        <Pressable
          accessibilityLabel={t("exploreMap.closeCard")}
          accessibilityRole="button"
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Intro({ t }: { t: T }) {
  return (
    <>
      <Text style={styles.eyebrow}>{t("tripPlanner.eyebrow")}</Text>
      <Text style={styles.title}>{t("tripPlanner.title")}</Text>
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
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={[styles.primary, (disabled || busy) && styles.dim]}
    >
      {busy ? <ActivityIndicator color={colors.white} /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function Chip({
  label,
  hint,
  onPress,
  active,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
      {hint ? (
        <Text style={[styles.chipHint, active && styles.chipTextActive]}>
          {hint}
        </Text>
      ) : null}
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
    <Page onBack={onBack} t={t}>
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
                  {shownDate(trip.startDate, locale)} –{" "}
                  {shownDate(trip.endDate, locale)} ·{" "}
                  {t("tripPlanner.saved.days", {
                    count: formatNumber(trip.dayCount, locale),
                  })}
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
      <Page onBack={onBack} t={t}>
        <Intro t={t} />
        <ActivityIndicator color={colors.primary} style={styles.loading} />
        <Text style={styles.sectionBody}>{t("tripPlanner.loading")}</Text>
      </Page>
    );
  if (!data)
    return (
      <Page onBack={onBack} t={t}>
        <Intro t={t} />
        <Text style={styles.error}>{t("tripPlanner.noOptions")}</Text>
      </Page>
    );

  if (!plannerSession)
    return (
      <Page onBack={onBack} t={t}>
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
    <Page onBack={onBack} scrollRef={scrollRef} t={t}>
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
          <Pressable
            onPress={() => setOpenerOpen(false)}
            style={styles.linkButton}
          >
            <Text style={styles.link}>{t("tripPlanner.opener.skip")}</Text>
          </Pressable>
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
          <Text style={styles.small}>
            {t("tripPlanner.chat.progress", {
              done: formatNumber(done, locale),
              total: formatNumber(active.length, locale),
            })}
          </Text>
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
        ? `${who} · ${t("tripPlanner.chat.groupSize.answer", {
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
            .join(" · ")
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
    <Pressable
      onPress={() => onChange((value) => skipQuestion(value, id))}
      style={styles.linkButton}
    >
      <Text style={styles.link}>{t("tripPlanner.chat.skipQuestion")}</Text>
    </Pressable>
  );

  if (id === "dates")
    return (
      <View style={styles.control}>
        <View style={styles.chips}>
          {DATE_PRESETS.map((preset) => (
            <Chip
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
      <View style={[styles.control, styles.chips]}>
        {data.travelStyles.map((style) => (
          <Chip
            hint={t(`tripPlanner.travelStyles.${style}.hint`)}
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
        <Pressable
          onPress={() => onChange(confirmNoInterests)}
          style={styles.linkButton}
        >
          <Text style={styles.link}>
            {t("tripPlanner.chat.interests.skip")}
          </Text>
        </Pressable>
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
      <Pressable
        onPress={() => onChange((value) => applyNotes(value, ""))}
        style={styles.linkButton}
      >
        <Text style={styles.link}>{t("tripPlanner.chat.notes.skip")}</Text>
      </Pressable>
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
  if (stop.tags.length) return stop.tags.slice(0, 2).join(" · ");
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
      <Page onBack={onBack} t={t}>
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
    <Page onBack={onBack} t={t}>
      <Text style={styles.eyebrow}>{t("tripPlanner.eyebrow")}</Text>
      <Text style={styles.title}>{plan.title}</Text>
      {plan.startDate && plan.endDate ? (
        <Text style={styles.dates}>
          {shownDate(plan.startDate, locale)} –{" "}
          {shownDate(plan.endDate, locale)} ·{" "}
          {formatNumber(plan.days.length, locale)} {t("tripPlanner.tripDays")}
        </Text>
      ) : null}
      {plan.summary ? <Text style={styles.intro}>{plan.summary}</Text> : null}
      {shareUrl ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void Share.share({ message: `${plan.title}\n${shareUrl}` })
          }
          style={styles.shareButton}
        >
          <Ionicons color={colors.primary} name="share-outline" size={18} />
          <Text style={styles.link}>{t("exploreMap.share")}</Text>
        </Pressable>
      ) : (
        <Text style={styles.small}>{t("tripPlanner.share.notSaved")}</Text>
      )}

      {plan.days.map((day) => (
        <View key={day.day} style={styles.day}>
          <Text style={styles.dayLabel}>
            {t("tripPlanner.day")} {formatNumber(day.day, locale)}
          </Text>
          <Text style={styles.dayTitle}>{day.title}</Text>
          {day.summary ? (
            <Text style={styles.sectionBody}>{day.summary}</Text>
          ) : null}
          {day.stops.length ? (
            day.stops.map((stop) => (
              <Pressable
                accessibilityRole="button"
                key={stop.id}
                onPress={() =>
                  onOpen(
                    itemFromHref(stop.href, "place", stop.name, stop.image),
                  )
                }
                style={styles.stop}
              >
                {stop.image ? (
                  <Image
                    source={{ uri: stop.image }}
                    style={styles.stopImage}
                  />
                ) : (
                  <View style={[styles.stopImage, styles.stopFallback]} />
                )}
                <View style={styles.stopCopy}>
                  <Text style={styles.stopTitle}>{stop.name}</Text>
                  {stop.destination ? (
                    <Text style={styles.stopMeta}>{stop.destination}</Text>
                  ) : null}
                  <Text style={styles.why}>
                    <Text style={styles.whyLabel}>
                      {t("tripPlanner.why")}:{" "}
                    </Text>
                    {whyItFits(stop, t)}
                  </Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.sectionBody}>
              {day.summary
                ? t("tripPlanner.freeDay")
                : t("tripPlanner.noStops")}
            </Text>
          )}
        </View>
      ))}

      {packages.length ? (
        <>
          <Text style={styles.small}>{t("tripPlanner.packages.eyebrow")}</Text>
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
          <Pressable
            onPress={() =>
              void Linking.openURL(websiteUrl(locale, ESSENTIALS[key]))
            }
            style={styles.linkButton}
          >
            <Text style={styles.link}>
              {t(`tripPlanner.essentials.${key}.cta`)} ↗
            </Text>
          </Pressable>
        </View>
      ))}
      <View style={[styles.card, styles.limeCard]}>
        <Text style={styles.small}>{t("tripPlanner.contact.eyebrow")}</Text>
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
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.stop}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.stopImage} />
      ) : (
        <View style={[styles.stopImage, styles.stopFallback]} />
      )}
      <View style={styles.stopCopy}>
        <Text style={styles.stopMeta}>
          {t(
            item.kind === "package"
              ? "tripPlanner.packages.kindPackage"
              : "tripPlanner.packages.kindEvent",
          )}
          {item.close ? ` · ${t("tripPlanner.packages.closeBadge")}` : ""}
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
            .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 56 },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
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
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 37,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 23 },
  dates: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    gap: 8,
    padding: 20,
  },
  limeCard: { backgroundColor: colors.lime },
  cardTitle: { color: colors.dark, fontSize: 19, fontWeight: "900" },
  cardBody: { color: colors.body, fontSize: 14, lineHeight: 21 },
  primary: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 6,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  dim: { opacity: 0.55 },
  loading: { marginTop: 24 },
  sectionTitle: {
    color: colors.dark,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 14,
  },
  sectionBody: { color: colors.body, fontSize: 14, lineHeight: 21 },
  small: { color: colors.body, fontSize: 12, fontWeight: "700" },
  spaced: { marginTop: 8 },
  link: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  linkButton: { alignSelf: "flex-start", paddingVertical: 8 },
  danger: { color: colors.danger, fontSize: 14, fontWeight: "800" },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  savedTrip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  savedCopy: { flex: 1 },
  savedTitle: { color: colors.dark, fontSize: 16, fontWeight: "800" },
  savedMeta: { color: colors.body, fontSize: 12, marginTop: 4 },
  confirmRow: { gap: 8 },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderRadius: 20,
    maxWidth: "92%",
    padding: 14,
  },
  assistantText: { color: colors.dark, fontSize: 15, lineHeight: 22 },
  answer: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginTop: 8,
    maxWidth: "88%",
    padding: 12,
  },
  answerText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  control: { gap: 10, marginTop: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  chipHint: { color: colors.body, fontSize: 12, marginTop: 2 },
  chipTextActive: { color: colors.white },
  textArea: {
    backgroundColor: colors.soft,
    borderColor: "transparent",
    borderRadius: radius.input,
    borderWidth: 1,
    color: colors.dark,
    fontSize: 15,
    marginTop: 10,
    minHeight: 96,
    padding: 14,
    textAlignVertical: "top",
  },
  invalid: { borderColor: colors.danger },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 6,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  stepLabel: { color: colors.dark, fontSize: 14, fontWeight: "800" },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    marginTop: 8,
    paddingTop: 14,
  },
  shareButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 6,
  },
  day: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    marginTop: 10,
    paddingTop: 16,
  },
  dayLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dayTitle: { color: colors.dark, fontSize: 20, fontWeight: "900" },
  stop: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 8,
  },
  stopImage: { borderRadius: 14, height: 86, width: 86 },
  stopFallback: { backgroundColor: colors.primary },
  stopCopy: { flex: 1, gap: 3, justifyContent: "center" },
  stopTitle: { color: colors.dark, fontSize: 16, fontWeight: "800" },
  stopMeta: { color: colors.body, fontSize: 12 },
  why: { color: colors.body, fontSize: 12, lineHeight: 17 },
  whyLabel: { color: colors.teal, fontWeight: "800" },
});
