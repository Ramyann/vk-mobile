import type { AppLocale } from "./locale";

/**
 * Strings the app shows that are not in src/i18n/web-messages.ts.
 *
 * Where the website already says the same thing, its Arabic and Kurdish are
 * copied here word for word, with the website key noted. The rest were
 * written for the app and are worth a read by a native speaker.
 */
const en = {
  // Shared
  loading: "Loading…", // web: common.loading
  errorTitle: "Unable to load this right now",
  tryAgain: "Try again", // web: featuredDestinations.tryAgain
  goBack: "Go back",
  close: "Close", // web: exploreMap.closeCard
  nothingHere: "Nothing here yet",
  emptyList: "This list is empty for now. Check back soon.",
  noEvents: "There are no upcoming events right now.",
  loadMore: "Load more",
  showPassword: "Show password", // web: auth.showPassword
  hidePassword: "Hide password", // web: auth.hidePassword

  // Content types, one item
  typeDestination: "Destination",
  typePlace: "Place", // web: chat.types.location
  typeEvent: "Event", // web: details.eventTag
  typePackage: "Package", // web: chat.types.package
  typeStory: "Story", // web: chat.types.story

  // Content types, as filters and list titles
  all: "All", // web: exploreMap.all
  destinations: "Destinations", // web: destinations.destinationsNoun
  places: "Places", // web: destinations.placesNoun
  events: "Events", // web: search.events
  packages: "Packages", // web: search.packages
  stories: "Stories", // web: search.stories
  placesToSee: "Places to see", // web: discover.placesToSeeTitle
  travelPackages: "Travel packages", // web: packages.heroTitle
  storiesAndGuides: "Stories & guides", // web: storiesSection.title
  dateRangeTo: "to",

  // Discover
  noResultsHint: "Try a destination, place, package, event or story by name.",
  clearSearch: "Clear search", // web: exploreMap.clearSearch

  // Saved
  savedEmptyTitle: "Nothing saved yet",
  savedEmptyBody:
    "Tap the heart on any place, event or story to keep it here, even offline.",
  startExploring: "Start exploring",
  removeFromSavedNamed: "Remove {{title}} from saved",

  // More
  groupPlan: "Plan",
  groupYou: "You",
  groupHelp: "Help",
  planDetail: "A day-by-day plan from confirmed places",
  exploreTheMap: "Explore the map", // web: map.title
  tripAssistant: "Trip assistant",
  travelNotifications: "Travel notifications",
  language: "Language",
  faq: "Frequently Asked Questions", // web: faq.heroTitle
  faqSearch: "Search questions",
  faqNoMatch: "No questions match “{{query}}”.",
  placeholderFirstName: "e.g. Sara",
  placeholderLastName: "e.g. Ahmed",
  placeholderEmail: "name@example.com",
  placeholderPassword: "Your password",
  placeholderNewPassword: "Create a strong password",
  placeholderConfirmPassword: "Type it again",
  placeholderSubject: "What is it about?",
  placeholderMessage: "Write your message here…",
  contactUs: "Contact Us", // web: exploreMap.ctaSecondaryLabel
  shop: "Shop", // web: nav.shop

  // Account
  savedTrips: "Saved trips",
  savedTripsDetail: "Plans from Plan your trip",
  savedPlaces: "Saved places",
  notifications: "Notifications",

  // Notifications
  notificationsIntro:
    "Choose the travel updates that are useful to you. You can change these at any time in the app or device settings.",
  notificationsDetail: "Receive chosen updates on this device",
  upcomingEvents: "Upcoming Events", // web: megaMenu.upcomingEvents
  upcomingEventsDetail: "New and upcoming events in Kurdistan",
  contentUpdates: "Content updates",
  contentUpdatesDetail: "New stories, guides and destinations",
  eventReminders: "Saved event reminders",
  eventRemindersDetail: "A reminder the day before a saved event",
  notificationsPhoneOnly:
    "Notifications work in the Visit Kurdistan app on your phone. Open the app to choose your travel updates.",
  notificationsSignIn:
    "Sign in first so your notification preferences can follow you to another device.",
  notificationsEnableFailed:
    "We couldn't turn on notifications. Check that Visit Kurdistan is allowed to send notifications in your phone's settings, then try again.",
  notificationsSaveFailed:
    "We couldn't save that change. Check your connection and try again.",

  // Detail
  about: "About", // web: exploreMap.about
  location: "Location", // web: details.factLocation
  date: "Date", // web: details.factDate
  governorate: "Governorate", // web: exploreMap.governorate
  arrivalAirport: "Arrival airport",
  departureAirport: "Departure Airport", // web: details.factDepartureAirport
  getDirections: "Get directions",
  save: "Save",
  removeFromSaved: "Remove from saved",
  saveToJourney: "Save to your journey",
  savedToJourney: "Saved to your journey",
  everyDay: "{{hours}}, every day",
  everyDayFrom: "Every day, {{hours}}",

  // Map
  useMyLocation: "Use my location",
  locationPermission:
    "Location permission is needed to sort places by distance.",
  locationFailed: "We could not get your current location.",

  // Contact, FAQ and language
  contactIntro: "We'll get back to you within 24 hours.", // web: contact.formSubtitle
  firstName: "First Name", // web: contact.firstNameLabel
  lastName: "Last Name", // web: contact.lastNameLabel
  email: "Email Address", // web: contact.emailLabel
  subject: "Subject", // web: contact.subjectLabel
  message: "Message", // web: contact.messageLabel
  sendMessage: "Send Message", // web: contact.sendButton
  completeAllFields: "Please complete all fields.",
  messageSent: "Message sent — we'll get back to you within 24 hours.", // web: contact.sendSuccess
  messageFailed: "Couldn't send your message. Please try again.", // web: contact.sendError
  faqIntro:
    "Everything you need to know before your Kurdistan adventure. Can't find what you're looking for? Our team is happy to help.", // web: faq.heroSubtitle
  languageIntro:
    "Choose the language used for content, FAQs and the trip assistant.",
  currentLanguage: "Current language: {{language}}",

  // Security check
  securityTitle: "Quick security check",
  securityBody: "Complete this quick check to continue.",
  // Assistant
  assistantHeadline: "Ask me anything about Kurdistan",
} as const;

export type AppMessageKey = keyof typeof en;

const ar: Record<AppMessageKey, string> = {
  loading: "جارٍ التحميل…",
  errorTitle: "تعذّر التحميل الآن",
  tryAgain: "حاول مرة أخرى",
  goBack: "رجوع",
  close: "إغلاق",
  nothingHere: "لا يوجد شيء هنا بعد",
  emptyList: "هذه القائمة فارغة حالياً. عُد قريباً.",
  noEvents: "لا توجد فعاليات قادمة حالياً.",
  loadMore: "تحميل المزيد",
  showPassword: "إظهار كلمة المرور",
  hidePassword: "إخفاء كلمة المرور",
  typeDestination: "وجهة",
  typePlace: "مكان",
  typeEvent: "فعالية",
  typePackage: "باقة",
  typeStory: "قصة",
  all: "الكل",
  destinations: "الوجهات",
  places: "الأماكن",
  events: "فعاليات",
  packages: "باقات",
  stories: "القصص",
  placesToSee: "أماكن يستحق زيارتها",
  travelPackages: "باقات السفر",
  storiesAndGuides: "قصص وأدلة",
  dateRangeTo: "إلى",
  noResultsHint: "جرّب البحث باسم وجهة أو مكان أو باقة أو فعالية أو قصة.",
  clearSearch: "مسح البحث",
  savedEmptyTitle: "لم تحفظ شيئاً بعد",
  savedEmptyBody:
    "اضغط على القلب في أي مكان أو فعالية أو قصة لتحتفظ بها هنا، حتى دون اتصال.",
  startExploring: "ابدأ الاستكشاف",
  removeFromSavedNamed: "إزالة {{title}} من المحفوظات",
  groupPlan: "التخطيط",
  groupYou: "أنت",
  groupHelp: "المساعدة",
  planDetail: "خطة يوماً بيوم من أماكن موثّقة",
  exploreTheMap: "استكشف الخريطة",
  tripAssistant: "مساعد الرحلات",
  travelNotifications: "إشعارات السفر",
  language: "اللغة",
  faq: "الأسئلة الشائعة",
  faqSearch: "ابحث في الأسئلة",
  faqNoMatch: "لا توجد أسئلة تطابق «{{query}}».",
  placeholderFirstName: "مثلاً: سارة",
  placeholderLastName: "مثلاً: أحمد",
  placeholderEmail: "name@example.com",
  placeholderPassword: "كلمة المرور",
  placeholderNewPassword: "أنشئ كلمة مرور قوية",
  placeholderConfirmPassword: "اكتبها مرة أخرى",
  placeholderSubject: "ما موضوع رسالتك؟",
  placeholderMessage: "اكتب رسالتك هنا…",
  contactUs: "تواصل معنا",
  shop: "تسوّق",
  savedTrips: "الرحلات المحفوظة",
  savedTripsDetail: "خطط من «خطط لرحلتك»",
  savedPlaces: "الأماكن المحفوظة",
  notifications: "الإشعارات",
  notificationsIntro:
    "اختر تحديثات السفر المفيدة لك. يمكنك تغييرها في أي وقت من التطبيق أو إعدادات الجهاز.",
  notificationsDetail: "استلم التحديثات المختارة على هذا الجهاز",
  upcomingEvents: "الفعاليات القادمة",
  upcomingEventsDetail: "فعاليات جديدة وقادمة في كردستان",
  contentUpdates: "تحديثات المحتوى",
  contentUpdatesDetail: "قصص وأدلة ووجهات جديدة",
  eventReminders: "تذكيرات الفعاليات المحفوظة",
  eventRemindersDetail: "تذكير قبل يوم من الفعالية المحفوظة",
  notificationsPhoneOnly:
    "تعمل الإشعارات في تطبيق زيارة كردستان على هاتفك. افتح التطبيق لاختيار تحديثات السفر.",
  notificationsSignIn:
    "سجّل الدخول أولاً لتنتقل تفضيلات الإشعارات معك إلى أي جهاز آخر.",
  notificationsEnableFailed:
    "تعذّر تفعيل الإشعارات. تأكد من السماح لتطبيق زيارة كردستان بإرسال الإشعارات في إعدادات هاتفك، ثم حاول مرة أخرى.",
  notificationsSaveFailed:
    "تعذّر حفظ هذا التغيير. تحقق من الاتصال وحاول مرة أخرى.",
  about: "نبذة",
  location: "الموقع",
  date: "التاريخ",
  governorate: "المحافظة",
  arrivalAirport: "مطار الوصول",
  departureAirport: "مطار المغادرة",
  getDirections: "احصل على الاتجاهات",
  save: "حفظ",
  removeFromSaved: "إزالة من المحفوظات",
  saveToJourney: "احفظه في رحلتك",
  savedToJourney: "محفوظ في رحلتك",
  everyDay: "{{hours}}، يومياً",
  everyDayFrom: "يومياً، {{hours}}",
  useMyLocation: "استخدم موقعي",
  locationPermission: "نحتاج إذن الموقع لترتيب الأماكن حسب المسافة.",
  locationFailed: "تعذّر تحديد موقعك الحالي.",
  contactIntro: "سنرد عليك خلال ٢٤ ساعة.",
  firstName: "الاسم الأول",
  lastName: "اسم العائلة",
  email: "البريد الإلكتروني",
  subject: "الموضوع",
  message: "الرسالة",
  sendMessage: "إرسال الرسالة",
  completeAllFields: "يرجى تعبئة جميع الحقول.",
  messageSent: "تم إرسال الرسالة، وسنرد عليك خلال ٢٤ ساعة.",
  messageFailed: "تعذّر إرسال رسالتك. يرجى المحاولة مرة أخرى.",
  faqIntro:
    "كل ما تحتاج معرفته قبل مغامرتك في كردستان. لم تجد ما تبحث عنه؟ فريقنا سعيد بمساعدتك.",
  languageIntro: "اختر لغة المحتوى والأسئلة الشائعة ومساعد الرحلات.",
  currentLanguage: "اللغة الحالية: {{language}}",
  securityTitle: "فحص أمني سريع",
  securityBody: "أكمل هذا الفحص السريع للمتابعة.",
  assistantHeadline: "اسألني أي شيء عن كردستان",
};

const ckb: Record<AppMessageKey, string> = {
  loading: "بارکردن…",
  errorTitle: "ئێستا ناتوانرێت بار بکرێت",
  tryAgain: "دووبارە هەوڵ بدەرەوە",
  goBack: "گەڕانەوە",
  close: "داخستن",
  nothingHere: "هێشتا هیچ شتێک لێرە نییە",
  emptyList: "ئەم لیستە ئێستا بەتاڵە. بەم زووانە سەردان بکەرەوە.",
  noEvents: "ئێستا هیچ بۆنەیەکی داهاتوو نییە.",
  loadMore: "زیاتر پیشان بدە",
  showPassword: "پیشاندانی وشەی نهێنی",
  hidePassword: "شاردنەوەی وشەی نهێنی",
  typeDestination: "شوێنی گەشتیاری",
  typePlace: "شوێن",
  typeEvent: "بۆنە",
  typePackage: "پاکێج",
  typeStory: "چیرۆک",
  all: "هەموو",
  destinations: "شوێنە گەشتیارییەکان",
  places: "شوێنەکان",
  events: "چالاکییەکان",
  packages: "پاکێجی گەشت",
  stories: "چیرۆکەکان",
  placesToSee: "شوێنەکان بۆ سەردان",
  travelPackages: "پاکێجی گەشت",
  storiesAndGuides: "چیڕۆک و ڕێبەرەکان",
  dateRangeTo: "تا",
  noResultsHint: "بە ناوی شوێنێک، پاکێجێک، بۆنەیەک یان چیرۆکێک بگەڕێ.",
  clearSearch: "سڕینەوەی گەڕان",
  savedEmptyTitle: "هێشتا هیچت پاشەکەوت نەکردووە",
  savedEmptyBody:
    "دڵەکە لەسەر هەر شوێن، بۆنە یان چیرۆکێک دابگرە بۆ ئەوەی لێرە بمێنێتەوە، تەنانەت بێ ئینتەرنێتیش.",
  startExploring: "دەست بە گەڕان بکە",
  removeFromSavedNamed: "لابردنی {{title}} لە پاشەکەوتکراوەکان",
  groupPlan: "پلاندانان",
  groupYou: "تۆ",
  groupHelp: "یارمەتی",
  planDetail: "پلانێکی ڕۆژ بە ڕۆژ لە شوێنە پشتڕاستکراوەکان",
  exploreTheMap: "نەخشەکە بگەڕێ",
  tripAssistant: "یاریدەدەری گەشت",
  travelNotifications: "ئاگادارکردنەوەکانی گەشت",
  language: "زمان",
  faq: "پرسیارە باوەکان",
  faqSearch: "بەدوای پرسیارەکاندا بگەڕێ",
  faqNoMatch: "هیچ پرسیارێک لەگەڵ «{{query}}» ناگونجێت.",
  placeholderFirstName: "بۆ نموونە: سارا",
  placeholderLastName: "بۆ نموونە: ئەحمەد",
  placeholderEmail: "name@example.com",
  placeholderPassword: "وشەی نهێنییەکەت",
  placeholderNewPassword: "وشەیەکی نهێنیی بەهێز دروست بکە",
  placeholderConfirmPassword: "دووبارە بینووسەوە",
  placeholderSubject: "بابەتەکە چییە؟",
  placeholderMessage: "نامەکەت لێرە بنووسە…",
  contactUs: "پەیوەندیمان پێوە بکە",
  shop: "بازاڕکردن",
  savedTrips: "گەشتە پاشەکەوتکراوەکان",
  savedTripsDetail: "پلانەکانی «پلانی گەشتەکەت دابنێ»",
  savedPlaces: "شوێنە پاشەکەوتکراوەکان",
  notifications: "ئاگادارکردنەوەکان",
  notificationsIntro:
    "ئەو نوێکارییانەی گەشت هەڵبژێرە کە بەسوودن بۆت. هەر کاتێک دەتوانیت لە ئەپەکە یان ڕێکخستنەکانی ئامێرەکەت بیانگۆڕیت.",
  notificationsDetail: "نوێکارییە هەڵبژێردراوەکان لەسەر ئەم ئامێرە وەربگرە",
  upcomingEvents: "چالاکییە داهاتووەکان",
  upcomingEventsDetail: "بۆنە نوێ و داهاتووەکان لە کوردستان",
  contentUpdates: "نوێکاری ناوەڕۆک",
  contentUpdatesDetail: "چیرۆک و ڕێبەر و شوێنی نوێ",
  eventReminders: "بیرخستنەوەی بۆنە پاشەکەوتکراوەکان",
  eventRemindersDetail: "بیرخستنەوەیەک ڕۆژێک پێش بۆنە پاشەکەوتکراوەکە",
  notificationsPhoneOnly:
    "ئاگادارکردنەوەکان لە ئەپی ڤیزیت کوردستان لەسەر مۆبایلەکەت کار دەکەن. ئەپەکە بکەرەوە بۆ هەڵبژاردنی نوێکارییەکانی گەشت.",
  notificationsSignIn:
    "سەرەتا بچۆ ژوورەوە بۆ ئەوەی ڕێکخستنەکانی ئاگادارکردنەوەت لەگەڵت بێن بۆ ئامێرێکی تر.",
  notificationsEnableFailed:
    "نەتوانرا ئاگادارکردنەوەکان چالاک بکرێن. دڵنیابەرەوە کە ڤیزیت کوردستان ڕێگەی پێدراوە ئاگادارکردنەوە بنێرێت لە ڕێکخستنەکانی مۆبایلەکەت، پاشان دووبارە هەوڵ بدەرەوە.",
  notificationsSaveFailed:
    "نەتوانرا ئەم گۆڕانکارییە پاشەکەوت بکرێت. پەیوەندییەکەت بپشکنە و دووبارە هەوڵ بدەرەوە.",
  about: "دەربارە",
  location: "شوێن",
  date: "ڕێکەوت",
  governorate: "پارێزگا",
  arrivalAirport: "فڕۆکەخانەی گەیشتن",
  departureAirport: "فڕۆکەخانەی بەڕێکەوتن",
  getDirections: "ڕێگاکە ببینە",
  save: "پاشەکەوتکردن",
  removeFromSaved: "لابردن لە پاشەکەوتکراوەکان",
  saveToJourney: "لە گەشتەکەتدا پاشەکەوتی بکە",
  savedToJourney: "لە گەشتەکەتدا پاشەکەوت کرا",
  everyDay: "{{hours}}، هەموو ڕۆژێک",
  everyDayFrom: "هەموو ڕۆژێک، {{hours}}",
  useMyLocation: "شوێنی من بەکاربهێنە",
  locationPermission:
    "بۆ ڕیزکردنی شوێنەکان بەپێی دووری، ڕێگەپێدانی شوێن پێویستە.",
  locationFailed: "نەمانتوانی شوێنی ئێستات بدۆزینەوە.",
  contactIntro: "لە ماوەی کەمتر لە ٢٤ کاتژمێردا وەڵامتان دەدەینەوە",
  firstName: "ناو",
  lastName: "پاشناو",
  email: "ئیمەیڵ",
  subject: "بابەت",
  message: "نامە",
  sendMessage: "نامەکە بنێرە",
  completeAllFields: "تکایە هەموو خانەکان پڕ بکەرەوە.",
  messageSent: "نامەکە نێردرا، لە ماوەی ٢٤ کاتژمێردا وەڵامت دەدەینەوە.",
  messageFailed: "نەمانتوانی نامەکەت بنێرین. تکایە دووبارە هەوڵ بدەرەوە.",
  faqIntro:
    "هەموو ئەوەی پێویستە پێش سەرکێشی کوردستان بیزانیت. ئەوەی بەدوایدا دەگەڕێیت نایدۆزیتەوە؟ تیمەکەمان بە خۆشییەوە یارمەتیت دەدات.",
  languageIntro: "زمانی ناوەڕۆک و پرسیارە باوەکان و یاریدەدەری گەشت هەڵبژێرە.",
  currentLanguage: "زمانی ئێستا: {{language}}",
  securityTitle: "پشکنینێکی خێرای ئاسایش",
  securityBody: "ئەم پشکنینە خێرایە تەواو بکە بۆ بەردەوامبوون.",
  assistantHeadline: "هەر پرسیارێکت دەربارەی کوردستان هەیە لێم بپرسە",
};

const messages: Record<AppLocale, Record<AppMessageKey, string>> = {
  en,
  ar,
  ckb,
};

/** An app string in the visitor's language, with {{name}} placeholders filled. */
export function ta(
  locale: AppLocale,
  key: AppMessageKey,
  vars?: Record<string, string | number>,
): string {
  const text = messages[locale][key] || en[key];
  return vars
    ? text.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
        String(vars[name] ?? ""),
      )
    : text;
}
