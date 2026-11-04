/**
 * Strings shared with the website, copied from
 * vk-frontend-v2/src/i18n/messages/{en,ar,ckb}.json so the app reads exactly
 * like the site in every language. Regenerate with
 * `node scripts/sync-web-messages.mjs` rather than hand-editing: an empty
 * string falls back to English, as on the website.
 */
export const webMessages = {
  en: {
    auth: {
      eyebrow: "VISIT KURDISTAN",
      emailLabel: "Email address",
      passwordLabel: "Password",
      newPasswordLabel: "New password",
      confirmPasswordLabel: "Confirm password",
      firstNameLabel: "First name",
      lastNameLabel: "Last name",
      showPassword: "Show password",
      hidePassword: "Hide password",
      passwordMismatch: "The two passwords do not match.",
      weakPassword: "This password does not meet all five requirements below.",
      backToSignIn: "Back to log in",
      signInNow: "Log in now",
      plannerNote:
        "Plan Your Trip keeps your plans in your account. Log in or create one, and you'll go straight back to it.",
      ruleMet: "met",
      ruleUnmet: "not met yet",
      rules: {
        length: "At least 8 characters",
        uppercase: "One uppercase letter",
        lowercase: "One lowercase letter",
        number: "One number",
        symbol: "One symbol (# ? ! @ $ % ^ & * -)",
      },
      login: {
        seoTitle: "Log in",
        panelTitle: "Welcome",
        panelBody:
          "Ready to explore more of Kurdistan? Log in to keep your itineraries and favorites close by.",
        title: "Log in",
        newHere: "New here?",
        createAccount: "Create an account",
        forgot: "Forgot your password?",
        submit: "Log in",
        submitting: "Logging in…",
        failed:
          "We could not sign you in. Please check your details and try again.",
      },
      signup: {
        seoTitle: "Create account",
        panelTitle: "Make your next trip your own.",
        panelBody:
          "A free visitor account. It is separate from the Visit Kurdistan dashboard and gives no staff access.",
        title: "Create an account",
        haveAccount: "Already have one?",
        signIn: "Log in",
        submit: "Create account",
        submitting: "Creating account…",
        checkEmail:
          "Check your email to verify your account, then come back and log in.",
        goToSignIn: "Go to log in",
        failed: "We could not create your account. Please try again.",
      },
      forgot: {
        seoTitle: "Reset password",
        panelTitle: "Locked out?",
        panelBody:
          "Give us the email address on your account and we will send a secure link to choose a new password.",
        title: "Reset your password",
        submit: "Email reset link",
        submitting: "Sending…",
        sent: "If an account uses that email address, we have sent a password-reset link. Check your inbox and your spam folder.",
        failed: "We could not send the reset email. Please try again.",
      },
      reset: {
        seoTitle: "Choose a new password",
        panelTitle: "Choose a new password.",
        panelBody:
          "Pick something you have not used here before. You will be logged out everywhere else once it is saved.",
        title: "Set a new password",
        submit: "Save new password",
        submitting: "Saving…",
        done: "Your password has been reset. You can log in with it now.",
        noToken:
          "This password-reset link is incomplete. It may have been cut in half by your email app — request a new one and open it in full.",
        requestNew: "Request a new reset link",
        failed:
          "We could not reset your password. The link may have expired — please request a new one.",
      },
      verify: {
        seoTitle: "Verify email",
        panelTitle: "One last step.",
        panelBody:
          "Verifying your email address confirms the account is yours and lets us reach you about your trips.",
        title: "Verify your email",
        checking: "Verifying your email…",
        verified: "Your email is verified. You can log in now.",
        invalid: "This verification link is invalid or has expired.",
        noToken:
          "This verification link is incomplete. Enter your email below and we will send a new one.",
        resend: "Resend verification email",
        resending: "Sending…",
        resendHint: "The address you used when you created the account.",
        resent:
          "If a pending account uses that email address, we have sent a new verification link.",
        resendFailed:
          "We could not send a new verification email. Please try again.",
      },
      backToSite: "Back to Visit Kurdistan",
      privacyPolicy: "Privacy Policy",
    },
    chat: {
      launcherLabel: "Open the Visit Kurdistan assistant",
      title: "Find your way around",
      disclaimer:
        "AI assistant. Conversations are stored to improve our service.",
      placeholder: "Tell me what you are looking for…",
      send: "Send",
      close: "Close chat",
      dismiss: "Dismiss",
      thinking: "Thinking",
      emptyTitle:
        "Tell me what you are interested in and I will point you to the right page. Try one of these:",
      suggestionsTitle: "Pages for you",
      alsoMentioned: "Also mentioned, no page yet",
      feedbackUp: "This answer was helpful",
      feedbackDown: "This answer was not helpful",
      verificationUnavailable:
        "The security check is unavailable. Please try again later.",
      verificationPending: "Security check in progress",
      verificationComplete: "Security check complete",
      starters: {
        threeDays: "Where should I go?",
        whatsOn: "What events are coming up?",
        bestTime: "Show me tour packages",
        newroz: "What is there to do?",
      },
      types: {
        location: "Place",
        destination: "City",
        event: "Event",
        package: "Package",
        story: "Story",
        faq: "FAQ",
        discover: "Discover",
        guide: "Guide",
      },
      errors: {
        generic: "Something went wrong. Please try again.",
        rateLimited:
          "You have reached the limit of 10 questions per hour. Please try again soon.",
        rateLimitedWithWait:
          "You have reached the limit of 10 questions per hour. Please try again {{wait}}.",
        unavailable:
          "The assistant is unavailable right now. Please try again later.",
        verification: "Please complete the security check first.",
        inputBlocked:
          "Please remove inappropriate language or personal contact details before sending.",
        unanswered:
          "Your last question didn't get an answer. It's back in the box below, so you can send it again.",
      },
      feedbackThanks: "Thanks for your feedback",
      clear: "Clear chat",
    },
    tripPlanner: {
      eyebrow: "YOUR KURDISTAN JOURNEY",
      title: "Plan a trip that feels like yours.",
      intro:
        "A calm, day-by-day suggestion based only on confirmed Visit Kurdistan places, packages and events.",
      inputBlocked:
        "Please remove inappropriate language or personal contact details before continuing.",
      surprise: "Show me the highlights",
      security: "Complete the security check to create your plan.",
      noOptions:
        "Trip planning options are not available just now. Please try again shortly.",
      error:
        "We could not create your trip just now. Your choices are still here—please try again.",
      tripDays: "day trip",
      mapTitle: "Your suggested route",
      showMap: "Show route map",
      hideMap: "Hide route map",
      mapLegend:
        "Day {{day}}, numbered in the order you'd visit them. The pale dots are the rest of the trip.",
      mapScopeTrip: "Whole trip",
      mapScopeDay: "Day {{day}}",
      mapLegendTrip:
        "All {{count}} days in order. Each pin is a day; the small dots are its stops.",
      mapStart: "Start",
      mapEnd: "End",
      saved: {
        title: "Pick up where you left off",
        subtitle:
          "Trips you've planned on this account. Open one to read it or carry on refining it.",
        open: "Open this trip",
        days: "{{count}} days",
        deleteNamed: "Delete {{title}}",
        confirmDelete: "Delete it",
        cancel: "Keep it",
        deleting: "Deleting…",
        deleteFailed: "That trip couldn't be deleted. Try again in a moment.",
        failed: "Your saved trips didn't load.",
        retry: "Try again",
        showAll: "Show all {{count}}",
      },
      recommendations: "You may also like",
      newTrip: "Start a new trip",
      anotherTrip: "Planning another trip?",
      edit: "Change my answers",
      day: "Day",
      noStops: "A free day to explore at your own pace.",
      why: "Why it fits",
      stopAbout: "About this place",
      stopHide: "Hide",
      freeDay: "Free time gives this route a comfortable pace.",
      startDate: "Start date",
      endDate: "End date",
      loading: "Loading the planner…",
      loadingSaved: "Opening your saved trip…",
      savedGoneTitle: "That trip link is no longer valid.",
      savedGoneBody:
        "It may have been deleted by the traveller who made it. You can plan a new trip in a couple of minutes.",
      travellerTypes: {
        solo: "Just me",
        couple: "Two of us",
        family: "Family",
        friends: "Friends",
      },
      travelStyles: {
        "single-base": {
          label: "Stay in one area",
          hint: "Short hops, unpack once",
        },
        touring: {
          label: "Move between cities",
          hint: "See more, travel more",
        },
      },
      pills: {
        events: "Events included",
      },
      chat: {
        progress: "{{done}} of {{total}}",
        change: "Change: {{question}}",
        ready: "That's everything I need. Shall I put your itinerary together?",
        build: "Build my itinerary",
        building: "Building your itinerary…",
        buildAnytime:
          "That's enough to build your trip. The rest is optional — answer what you like, or go now.",
        skipQuestion: "Skip",
        skipped: "Skipped",
        answerNow: "Answer: {{question}}",
        dates: {
          prompt:
            "When are you coming? Your dates set the length of the trip and which events I can include.",
          presets: {
            weekend: "A long weekend",
            week: "About a week",
            tenDays: "Ten days",
          },
          presetNights: "{{count}} days",
          orPick: "Or choose exact dates",
          confirm: "Use these dates",
          length: "{{count}} days",
          answer: "{{start}} to {{end}} · {{count}} days",
        },
        travellerType: {
          prompt: "Who's travelling?",
        },
        groupSize: {
          prompt: "How many of you altogether?",
          more: "Or type a number (up to {{max}})",
          confirm: "That's us",
          answer: "{{count}} travellers",
        },
        arrival: {
          prompt: "Where are you flying into?",
          unsure: "Not sure yet",
        },
        travelStyle: {
          prompt:
            "Would you rather settle in one area, or move between cities?",
        },
        destination: {
          prompt: "Which area would you like to base yourself in?",
          anywhere: "Anywhere you'd suggest",
        },
        locationCategory: {
          prompt: "What kind of places would you most like to explore?",
        },
        interests: {
          prompt:
            "What would make this trip memorable? Pick up to six, or skip and I'll go with the highlights.",
          more: "{{n}} more",
          skip: "Just show me the highlights",
          count: "{{count}} of {{max}} chosen",
          noPreference: "Show me the highlights",
        },
        events: {
          prompt:
            "Shall I include festivals and events happening on your dates?",
          yes: "Yes, include them",
          no: "No, just places",
        },
        notes: {
          prompt:
            "Anything else I should know? One sentence is plenty — travelling with young children, a rented car, something you'd rather avoid.",
          label: "Anything else I should know",
          placeholder:
            "We're travelling with my parents, and one of them uses a wheelchair.",
          send: "Send",
          skip: "Nothing to add",
          skipped: "Nothing to add",
        },
      },
      refine: {
        title: "Want to change anything?",
        intro:
          "Tell me in your own words and I'll adjust this itinerary — the rest stays as it is.",
        label: "What would you like to change?",
        placeholder: "Make day 2 lighter…",
        apply: "Adjust my trip",
        applying: "Adjusting your trip…",
        left: "{{count}} adjustments left",
        exhausted:
          "This trip has been adjusted as many times as I can manage. Start a new plan if you'd like to keep going.",
        failed: "I could not adjust your trip just now. Please try again.",
        suggestions: {
          lighter: "Make day 2 lighter",
          moreFood: "More food and markets",
          moreOutdoors: "More time outdoors",
          swapDay: "Swap the last day for something quieter",
        },
      },
      share: {
        saved: "Saved to your account — this link will still work later.",
        notSaved:
          "This itinerary was created but could not be saved, so it has no shareable link. Print it if you'd like to keep it.",
        urlLabel: "Link to this trip",
        copy: "Copy link",
        copied: "Copied",
      },
      opener: {
        prompt:
          "Tell me about your trip in your own words, and I'll fill in what I can. Or skip this and I'll just ask.",
        label: "Describe your trip",
        placeholder:
          "Five days in October with my kids, flying into Erbil, mostly nature and food…",
        examplesLabel: "For example:",
        examples: {
          family:
            "A week in October with my two kids, flying into Erbil, mostly nature and easy walks",
          couple:
            "Long weekend for the two of us, staying in Sulaymaniyah, food and history",
          solo: "Ten days on my own moving between cities, I have a rented car",
        },
        submit: "Plan from this",
        reading: "Reading your notes…",
        skip: "Just ask me the questions",
        understood_one:
          "Got that — I picked up one thing. Tap it to change it, and I'll ask about the rest.",
        understood_other:
          "Got that — here's what I picked up. Tap anything to change it, and I'll ask about the rest.",
        unmatched:
          "I couldn't match {{items}} to anything we cover, so I've left that out. Everything else is below.",
        failed:
          "I could not read that just now. You can try again, or answer the questions instead.",
      },
      packages: {
        eyebrow: "Ready to book",
        title: "Packages that fit this trip",
        closeTitle: "The closest packages we run",
        closeBadge: "Closest match",
        kindPackage: "Package",
        kindEvent: "Event",
        nights_one: "{{count}} night",
        nights_other: "{{count}} nights",
      },
      contact: {
        eyebrow: "Something else in mind?",
        title: "Tell us what you're after",
        body: "If you want a private guide, a different route, or a trip built around something specific, talk to us and we'll arrange it.",
        cta: "Contact us",
      },
      essentials: {
        food: {
          title: "Feeling hungry?",
          body: "Discover Kurdish dishes and local flavours to enjoy along the way.",
          cta: "Explore Taste of Kurdistan",
        },
        stay: {
          title: "Looking for somewhere to stay?",
          body: "Explore resorts for a relaxing break during your trip.",
          cta: "Browse resorts",
        },
      },
    },
    exploreMap: {
      eyebrow: "On The Map",
      title: "Explore Kurdistan on the Map",
      intro:
        "Every destination we cover, pinned in one place. Follow your curiosity across Kurdistan.",
      governorate: "Governorate",
      all: "All",
      seasons: {
        all: "All seasons",
        spring: "Spring",
        summer: "Summer",
        autumn: "Autumn",
        winter: "Winter",
      },
      count: "{{total}} places",
      count_one: "{{total}} place",
      noPlaces: "No places match these filters yet.",
      clearFilters: "Clear filters",
      viewPlace: "View place",
      closeCard: "Close",
      directions: "Directions",
      share: "Share",
      linkCopied: "Link copied",
      bestTime: "Best time to visit",
      inSeason: "In season",
      about: "About",
      readMore: "Read more",
      readLess: "Show less",
      today: "Today",
      openNow: "Open now",
      closedNow: "Closed now",
      closedToday: "Closed today",
      closesAt: "Closes {{time}}",
      opensAt: "Opens {{time}}",
      distanceAway: "{{distance}} km from you",
      previous: "Previous place",
      next: "Next place",
      position: "{{current}} of {{total}}",
      expandDetails: "Show more details",
      collapseDetails: "Show fewer details",
      photos: "Photos",
      showPhoto: "Show photo {{number}}",
      searchLabel: "Search places by name",
      searchPlaceholder: "Search places",
      clearSearch: "Clear search",
      filters: "Filters",
      category: "Category",
      clearAll: "Clear all",
      results: "Places on the map",
      showList: "Show list",
      hideList: "Hide list",
      allGovernorates: "All governorates",
      cluster: "{{count}} places here. Zoom in to see them",
      mapUnavailable:
        "This browser can't show the map. The list still has every place.",
      details: "Details",
      ctaTitle: "Create Your Custom Trip",
      ctaSubtitle:
        "Work with our travel experts to design a personalized Kurdistan experience tailored to your interests, schedule, and budget.",
      ctaPrimaryLabel: "Plan Your Trip",
      ctaSecondaryLabel: "Contact Us",
    },
    turnstile: {
      unavailable: "The security check is unavailable. Please try again later.",
      expired: "The security check expired. Please complete it again.",
      timedOut: "The security check timed out. Please try again.",
      failed: "The security check could not be completed. Please try again.",
      loadFailed:
        "The security check could not be loaded. Please refresh and try again.",
    },
    destinations: {
      mapCtaTitle: "See Every Destination on the Map",
      mapCtaSubtitle:
        "Find places across Kurdistan on one map. Search by name and filter by governorate and category.",
      openMap: "Open the Map",
      website: "Website",
      openingHours: "Opening Hours",
      socialMedia: "Social Media",
    },
    places: {
      open24Hours: "Open 24 hours",
      closed: "Closed",
    },
    header: {
      account: {
        signIn: "Log in",
        signOut: "Log out",
        signedInAs: "Logged in as {{name}}",
        signInOrCreate: "Log in or create an account",
        menuLabel: "Your account",
        signOutTitle: "Log out?",
        signOutBody:
          "You'll be taken back to the home page. Your saved trips stay saved — log in again any time to pick them up.",
        signOutCancel: "Stay logged in",
        signingOut: "Logging out…",
      },
    },
  },
  ar: {
    auth: {
      eyebrow: "زيارة كردستان",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      newPasswordLabel: "كلمة المرور الجديدة",
      confirmPasswordLabel: "تأكيد كلمة المرور",
      firstNameLabel: "الاسم الأول",
      lastNameLabel: "اسم العائلة",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      weakPassword: "كلمة المرور هذه لا تحقق الشروط الخمسة أدناه.",
      backToSignIn: "العودة إلى تسجيل الدخول",
      signInNow: "تسجيل الدخول الآن",
      plannerNote:
        "تحفظ ميزة «خطط لرحلتك» خططك في حسابك. سجّل الدخول أو أنشئ حساباً، وستعود إليها مباشرة.",
      ruleMet: "محقّق",
      ruleUnmet: "غير محقّق بعد",
      rules: {
        length: "٨ أحرف على الأقل",
        uppercase: "حرف لاتيني كبير واحد",
        lowercase: "حرف لاتيني صغير واحد",
        number: "رقم واحد",
        symbol: "رمز واحد (# ? ! @ $ % ^ & * -)",
      },
      login: {
        seoTitle: "تسجيل الدخول",
        panelTitle: "أهلاً بعودتك.",
        panelBody:
          "سجّل دخولك لتبقى رحلاتك المحفوظة وتفضيلاتك معك أثناء استكشاف كردستان.",
        title: "تسجيل الدخول",
        newHere: "جديد هنا؟",
        createAccount: "أنشئ حساباً",
        forgot: "هل نسيت كلمة المرور؟",
        submit: "تسجيل الدخول",
        submitting: "جارٍ تسجيل الدخول…",
        failed: "لم نتمكن من تسجيل دخولك. تحقق من بياناتك وحاول مرة أخرى.",
      },
      signup: {
        seoTitle: "إنشاء حساب",
        panelTitle: "اجعل رحلتك القادمة على مقاسك.",
        panelBody:
          "حساب زائر مجاني، منفصل عن لوحة تحكم Visit Kurdistan ولا يمنح أي صلاحيات إدارية.",
        title: "إنشاء حساب",
        haveAccount: "لديك حساب بالفعل؟",
        signIn: "تسجيل الدخول",
        submit: "إنشاء الحساب",
        submitting: "جارٍ إنشاء الحساب…",
        checkEmail:
          "تحقق من بريدك الإلكتروني لتأكيد حسابك، ثم عد لتسجيل الدخول.",
        goToSignIn: "الانتقال إلى تسجيل الدخول",
        failed: "لم نتمكن من إنشاء حسابك. يرجى المحاولة مرة أخرى.",
      },
      forgot: {
        seoTitle: "إعادة تعيين كلمة المرور",
        panelTitle: "تعذّر عليك الدخول؟",
        panelBody:
          "أعطنا البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابطاً آمناً لاختيار كلمة مرور جديدة.",
        title: "إعادة تعيين كلمة المرور",
        submit: "إرسال رابط إعادة التعيين",
        submitting: "جارٍ الإرسال…",
        sent: "إذا كان هناك حساب مرتبط بهذا البريد، فقد أرسلنا رابط إعادة تعيين كلمة المرور. تحقق من صندوق الوارد ومن مجلد البريد المزعج.",
        failed:
          "لم نتمكن من إرسال رسالة إعادة التعيين. يرجى المحاولة مرة أخرى.",
      },
      reset: {
        seoTitle: "اختيار كلمة مرور جديدة",
        panelTitle: "اختر كلمة مرور جديدة.",
        panelBody:
          "اختر كلمة لم تستخدمها هنا من قبل. سيتم تسجيل خروجك من الأجهزة الأخرى بعد حفظها.",
        title: "تعيين كلمة مرور جديدة",
        submit: "حفظ كلمة المرور الجديدة",
        submitting: "جارٍ الحفظ…",
        done: "تم إعادة تعيين كلمة مرورك. يمكنك تسجيل الدخول بها الآن.",
        noToken:
          "رابط إعادة تعيين كلمة المرور غير مكتمل، وربما قُطع في تطبيق البريد. اطلب رابطاً جديداً وافتحه كاملاً.",
        requestNew: "طلب رابط إعادة تعيين جديد",
        failed:
          "لم نتمكن من إعادة تعيين كلمة مرورك، وربما انتهت صلاحية الرابط. يرجى طلب رابط جديد.",
      },
      verify: {
        seoTitle: "تأكيد البريد الإلكتروني",
        panelTitle: "خطوة أخيرة.",
        panelBody:
          "تأكيد بريدك الإلكتروني يثبت أن الحساب لك ويتيح لنا التواصل معك بشأن رحلاتك.",
        title: "تأكيد بريدك الإلكتروني",
        checking: "جارٍ تأكيد بريدك الإلكتروني…",
        verified: "تم تأكيد بريدك الإلكتروني. يمكنك تسجيل الدخول الآن.",
        invalid: "رابط التأكيد غير صالح أو انتهت صلاحيته.",
        noToken:
          "رابط التأكيد غير مكتمل. أدخل بريدك الإلكتروني أدناه وسنرسل رابطاً جديداً.",
        resend: "إعادة إرسال رسالة التأكيد",
        resending: "جارٍ الإرسال…",
        resendHint: "العنوان الذي استخدمته عند إنشاء الحساب.",
        resent:
          "إذا كان هناك حساب معلّق مرتبط بهذا البريد، فقد أرسلنا رابط تأكيد جديداً.",
        resendFailed:
          "لم نتمكن من إرسال رسالة تأكيد جديدة. يرجى المحاولة مرة أخرى.",
      },
      backToSite: "العودة إلى Visit Kurdistan",
      privacyPolicy: "سياسة الخصوصية",
    },
    chat: {
      launcherLabel: "افتح مساعد زوروا كردستان",
      title: "دليلك في الموقع",
      disclaimer: "مساعد ذكاء اصطناعي. يتم حفظ المحادثات لتحسين خدمتنا.",
      placeholder: "أخبرني عما تبحث عنه…",
      send: "إرسال",
      close: "إغلاق المحادثة",
      dismiss: "إخفاء",
      thinking: "جاري التفكير",
      emptyTitle: "أخبرني بما يهمك وسأرشدك إلى الصفحة المناسبة. جرّب أحد هذه:",
      suggestionsTitle: "صفحات تناسبك",
      alsoMentioned: "ذُكرت أيضًا، ولا توجد صفحة لها بعد",
      feedbackUp: "كانت هذه الإجابة مفيدة",
      feedbackDown: "لم تكن هذه الإجابة مفيدة",
      verificationUnavailable: "التحقق الأمني غير متاح. يرجى المحاولة لاحقاً.",
      verificationPending: "جارٍ التحقق الأمني",
      verificationComplete: "اكتمل التحقق الأمني",
      starters: {
        threeDays: "إلى أين أذهب؟",
        whatsOn: "ما الفعاليات القادمة؟",
        bestTime: "أرني الباقات السياحية",
        newroz: "ما الأنشطة المتاحة؟",
      },
      types: {
        location: "مكان",
        destination: "مدينة",
        event: "فعالية",
        package: "باقة",
        story: "قصة",
        faq: "سؤال شائع",
        discover: "اكتشف",
        guide: "دليل",
      },
      errors: {
        generic: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        rateLimited:
          "لقد وصلت إلى الحد الأقصى وهو 10 أسئلة في الساعة. يرجى المحاولة مرة أخرى قريباً.",
        rateLimitedWithWait:
          "لقد وصلت إلى الحد الأقصى وهو 10 أسئلة في الساعة. يرجى المحاولة مرة أخرى {{wait}}.",
        unavailable: "المساعد غير متاح حالياً. يرجى المحاولة لاحقاً.",
        verification: "يرجى إكمال التحقق الأمني أولاً.",
        inputBlocked:
          "يرجى إزالة اللغة غير المناسبة أو بيانات الاتصال الشخصية قبل الإرسال.",
        unanswered:
          "لم يصل ردّ على سؤالك الأخير. أعدناه إلى المربع أدناه لتتمكن من إرساله مجدداً.",
      },
      feedbackThanks: "شكرًا على ملاحظاتك",
      clear: "مسح المحادثة",
    },
    tripPlanner: {
      eyebrow: "رحلتك إلى كردستان",
      title: "خطط لرحلة تشبهك.",
      intro:
        "اقتراح هادئ يوماً بيوم، مبني فقط على أماكن وباقات وفعاليات مؤكدة من Visit Kurdistan.",
      inputBlocked:
        "يرجى إزالة اللغة غير المناسبة أو بيانات الاتصال الشخصية قبل المتابعة.",
      surprise: "أرني أبرز المعالم",
      security: "أكمل التحقق الأمني لإنشاء خطتك.",
      noOptions: "خيارات تخطيط الرحلات غير متاحة الآن. حاول مرة أخرى قريباً.",
      error: "تعذر إنشاء رحلتك الآن. ما زالت اختياراتك محفوظة—حاول مرة أخرى.",
      tripDays: "أيام",
      mapTitle: "مسارك المقترح",
      showMap: "إظهار الخريطة",
      hideMap: "إخفاء الخريطة",
      mapLegend:
        "اليوم {{day}}، مرقّم بالترتيب الذي ستزورها به. النقاط الباهتة هي بقية الرحلة.",
      mapScopeTrip: "الرحلة كاملة",
      mapScopeDay: "اليوم {{day}}",
      mapLegendTrip:
        "الأيام {{count}} كلها بالترتيب. كل علامة تمثّل يوماً، والنقاط الصغيرة هي محطاته.",
      mapStart: "البداية",
      mapEnd: "النهاية",
      saved: {
        title: "تابع من حيث توقفت",
        subtitle:
          "الرحلات التي خطّطتها بهذا الحساب. افتح إحداها لقراءتها أو متابعة تعديلها.",
        open: "افتح هذه الرحلة",
        days: "{{count}} أيام",
        deleteNamed: "حذف {{title}}",
        confirmDelete: "احذفها",
        cancel: "أبقِها",
        deleting: "جارٍ الحذف…",
        deleteFailed: "تعذّر حذف هذه الرحلة. أعد المحاولة بعد قليل.",
        failed: "تعذّر تحميل رحلاتك المحفوظة.",
        retry: "أعد المحاولة",
        showAll: "اعرض الكل ({{count}})",
      },
      recommendations: "قد يعجبك أيضاً",
      newTrip: "خطط لرحلة جديدة",
      anotherTrip: "تخطط لرحلة أخرى؟",
      edit: "تغيير إجاباتي",
      day: "اليوم",
      noStops: "وقت حر للاستكشاف على راحتك.",
      why: "لماذا يناسبك",
      stopAbout: "عن هذا المكان",
      stopHide: "إخفاء",
      freeDay: "الوقت الحر يجعل مسار الرحلة مريحاً.",
      startDate: "تاريخ البداية",
      endDate: "تاريخ النهاية",
      loading: "جارٍ تحميل مخطط الرحلة…",
      loadingSaved: "جارٍ فتح رحلتك المحفوظة…",
      savedGoneTitle: "رابط الرحلة لم يعد صالحاً.",
      savedGoneBody:
        "ربما حذفه المسافر الذي أنشأه. يمكنك التخطيط لرحلة جديدة في دقيقتين.",
      travellerTypes: {
        solo: "أنا فقط",
        couple: "شخصان",
        family: "عائلة",
        friends: "أصدقاء",
      },
      travelStyles: {
        "single-base": {
          label: "البقاء في منطقة واحدة",
          hint: "تنقلات قصيرة، وإقامة واحدة",
        },
        touring: {
          label: "التنقل بين المدن",
          hint: "مشاهدة أكثر، وتنقّل أكثر",
        },
      },
      pills: {
        events: "الفعاليات مُدرجة",
      },
      chat: {
        progress: "{{done}} من {{total}}",
        change: "تغيير: {{question}}",
        ready: "هذا كل ما أحتاجه. هل أجهّز لك خط الرحلة؟",
        build: "جهّز خط رحلتي",
        building: "جارٍ تجهيز خط رحلتك…",
        buildAnytime:
          "هذا يكفي لتجهيز رحلتك. البقية اختيارية — أجب عمّا تشاء، أو ابدأ الآن.",
        skipQuestion: "تجاوز",
        skipped: "تم التجاوز",
        answerNow: "أجب: {{question}}",
        dates: {
          prompt:
            "متى ستأتي؟ تحدّد تواريخك طول الرحلة والفعاليات التي يمكنني إدراجها.",
          presets: {
            weekend: "عطلة نهاية أسبوع طويلة",
            week: "نحو أسبوع",
            tenDays: "عشرة أيام",
          },
          presetNights: "{{count}} أيام",
          orPick: "أو اختر تواريخ محددة",
          confirm: "استخدم هذه التواريخ",
          length: "{{count}} أيام",
          answer: "{{count}} أيام، من {{start}} إلى {{end}}",
        },
        travellerType: {
          prompt: "من سيسافر؟",
        },
        groupSize: {
          prompt: "كم عددكم إجمالاً؟",
          more: "أو اكتب عدداً (حتى {{max}})",
          confirm: "هذا عددنا",
          answer: "{{count}} مسافرين",
        },
        arrival: {
          prompt: "إلى أي مطار ستصل؟",
          unsure: "لم أحدّد بعد",
        },
        travelStyle: {
          prompt: "تفضّل الاستقرار في منطقة واحدة أم التنقل بين المدن؟",
        },
        destination: {
          prompt: "في أي منطقة تحب أن تكون إقامتك؟",
          anywhere: "أي مكان تقترحه",
        },
        locationCategory: {
          prompt: "ما نوع الأماكن التي تود استكشافها أكثر؟",
        },
        interests: {
          prompt:
            "ما الذي سيجعل هذه الرحلة لا تُنسى؟ اختر حتى ستة، أو تجاوز الأمر وسأختار أبرز المعالم.",
          more: "{{n}} أخرى",
          skip: "اعرض لي أبرز المعالم",
          count: "اخترت {{count}} من {{max}}",
          noPreference: "أبرز المعالم",
        },
        events: {
          prompt: "هل أدرج المهرجانات والفعاليات التي تقع في تواريخك؟",
          yes: "نعم، أدرجها",
          no: "لا، الأماكن فقط",
        },
        notes: {
          prompt:
            "هل من شيء آخر ينبغي أن أعرفه؟ جملة واحدة تكفي — سفر مع أطفال صغار، سيارة مستأجرة، أو شيء تفضّل تجنّبه.",
          label: "أي شيء آخر ينبغي أن أعرفه",
          placeholder: "نسافر مع والديّ، وأحدهما يستخدم كرسياً متحركاً.",
          send: "إرسال",
          skip: "لا شيء أضيفه",
          skipped: "لا شيء أضيفه",
        },
      },
      refine: {
        title: "تريد تغيير شيء؟",
        intro: "أخبرني بكلماتك وسأعدّل خط الرحلة — وسيبقى الباقي كما هو.",
        label: "ما الذي تريد تغييره؟",
        placeholder: "اجعل اليوم الثاني أخف…",
        apply: "عدّل رحلتي",
        applying: "جارٍ تعديل رحلتك…",
        left: "بقي {{count}} تعديلات",
        exhausted:
          "عُدّلت هذه الرحلة إلى أقصى حد ممكن. ابدأ خطة جديدة إذا أردت المتابعة.",
        failed: "لم أتمكن من تعديل رحلتك الآن. يرجى المحاولة مرة أخرى.",
        suggestions: {
          lighter: "اجعل اليوم الثاني أخف",
          moreFood: "المزيد من المطاعم والأسواق",
          moreOutdoors: "وقت أكثر في الهواء الطلق",
          swapDay: "استبدل اليوم الأخير بشيء أهدأ",
        },
      },
      share: {
        saved: "تم الحفظ في حسابك — سيبقى هذا الرابط يعمل لاحقاً.",
        notSaved:
          "أُنشئ خط الرحلة لكن لم نتمكن من حفظه، لذا لا يوجد رابط للمشاركة. اطبعه إن أردت الاحتفاظ به.",
        urlLabel: "رابط هذه الرحلة",
        copy: "نسخ الرابط",
        copied: "تم النسخ",
      },
      opener: {
        prompt:
          "حدّثني عن رحلتك بكلماتك، وسأكمل ما أستطيع. أو تجاوز هذا وسأسألك مباشرة.",
        label: "اوصف رحلتك",
        placeholder:
          "خمسة أيام في أكتوبر مع أطفالي، سنصل إلى مطار أربيل، ونفضّل الطبيعة والمأكولات…",
        examplesLabel: "على سبيل المثال:",
        examples: {
          family:
            "أسبوع في أكتوبر مع طفليّ، سنصل إلى أربيل، ونفضّل الطبيعة والمشي الهادئ",
          couple:
            "عطلة نهاية أسبوع طويلة لنا نحن الاثنان، إقامة في السليمانية، مأكولات وتاريخ",
          solo: "عشرة أيام بمفردي أتنقل بين المدن، ولديّ سيارة مستأجرة",
        },
        submit: "خطّط انطلاقاً من هذا",
        reading: "جارٍ قراءة ملاحظاتك…",
        skip: "اسألني الأسئلة فقط",
        understood_one:
          "فهمت — التقطت معلومة واحدة. اضغط عليها لتغييرها، وسأسأل عن الباقي.",
        understood_other:
          "فهمت — هذا ما التقطته. اضغط على أي شيء لتغييره، وسأسأل عن الباقي.",
        unmatched:
          "لم أتمكن من مطابقة {{items}} مع ما نغطّيه، لذا تركتها جانباً. كل ما تبقّى موجود أدناه.",
        failed:
          "لم أتمكن من قراءة ذلك الآن. يمكنك المحاولة مرة أخرى، أو الإجابة على الأسئلة بدلاً من ذلك.",
      },
      packages: {
        eyebrow: "جاهزة للحجز",
        title: "باقات تناسب هذه الرحلة",
        closeTitle: "أقرب الباقات المتاحة لدينا",
        closeBadge: "الأقرب",
        kindPackage: "باقة",
        kindEvent: "فعالية",
        nights_one: "ليلة واحدة",
        nights_other: "{{count}} ليلة",
      },
      contact: {
        eyebrow: "لديك فكرة أخرى؟",
        title: "أخبرنا بما تبحث عنه",
        body: "إذا كنت تريد مرشداً خاصاً أو مساراً مختلفاً أو رحلة مبنية على طلب محدد، تواصل معنا وسنرتّبها لك.",
        cta: "تواصل معنا",
      },
      essentials: {
        food: {
          title: "هل تشعر بالجوع؟",
          body: "اكتشف الأطباق الكردية والنكهات المحلية لتستمتع بها خلال رحلتك.",
          cta: "اكتشف مذاق كردستان",
        },
        stay: {
          title: "تبحث عن مكان للإقامة؟",
          body: "استكشف المنتجعات لقضاء استراحة مريحة خلال رحلتك.",
          cta: "تصفح المنتجعات",
        },
      },
    },
    exploreMap: {
      eyebrow: "على الخريطة",
      title: "استكشف كردستان على الخريطة",
      intro:
        "كل وجهة نتحدث عنها، مثبّتة في مكان واحد. اتبع فضولك في أرجاء كوردستان.",
      governorate: "المحافظة",
      all: "الكل",
      seasons: {
        all: "كل المواسم",
        spring: "الربيع",
        summer: "الصيف",
        autumn: "الخريف",
        winter: "الشتاء",
      },
      count: "الأماكن: {{total}}",
      count_one: "مكان واحد",
      noPlaces: "لا توجد أماكن تطابق هذه الفلاتر بعد.",
      clearFilters: "مسح الفلاتر",
      viewPlace: "عرض المكان",
      closeCard: "إغلاق",
      directions: "الاتجاهات",
      share: "مشاركة",
      linkCopied: "تم نسخ الرابط",
      bestTime: "أفضل وقت للزيارة",
      inSeason: "في موسمه الآن",
      about: "نبذة",
      readMore: "اقرأ المزيد",
      readLess: "عرض أقل",
      today: "اليوم",
      openNow: "مفتوح الآن",
      closedNow: "مغلق الآن",
      closedToday: "مغلق اليوم",
      closesAt: "يغلق {{time}}",
      opensAt: "يفتح {{time}}",
      distanceAway: "على بعد {{distance}} كم منك",
      previous: "المكان السابق",
      next: "المكان التالي",
      position: "{{current}} من {{total}}",
      expandDetails: "عرض المزيد من التفاصيل",
      collapseDetails: "عرض تفاصيل أقل",
      photos: "الصور",
      showPhoto: "عرض الصورة {{number}}",
      searchLabel: "ابحث عن الأماكن بالاسم",
      searchPlaceholder: "ابحث عن مكان",
      clearSearch: "مسح البحث",
      filters: "الفلاتر",
      category: "الفئة",
      clearAll: "مسح الكل",
      results: "الأماكن على الخريطة",
      showList: "عرض القائمة",
      hideList: "إخفاء القائمة",
      allGovernorates: "كل المحافظات",
      cluster: "أماكن هنا: {{count}}. كبّر الخريطة لرؤيتها",
      mapUnavailable:
        "لا يستطيع هذا المتصفح عرض الخريطة. لا تزال القائمة تضم كل الأماكن.",
      details: "التفاصيل",
      ctaTitle: "صمم رحلتك المخصصة",
      ctaSubtitle:
        "اعمل مع خبراء السفر لدينا لتصميم تجربة كردستانية تناسب اهتماماتك ووقتك وميزانيتك.",
      ctaPrimaryLabel: "خطط لرحلتك",
      ctaSecondaryLabel: "تواصل معنا",
    },
    turnstile: {
      unavailable: "التحقق الأمني غير متاح. يرجى المحاولة لاحقاً.",
      expired: "انتهت صلاحية التحقق الأمني. يرجى إكماله مرة أخرى.",
      timedOut: "انتهت مهلة التحقق الأمني. يرجى المحاولة مرة أخرى.",
      failed: "تعذّر إكمال التحقق الأمني. يرجى المحاولة مرة أخرى.",
      loadFailed:
        "تعذّر تحميل التحقق الأمني. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
    },
    destinations: {
      mapCtaTitle: "شاهد كل الوجهات على الخريطة",
      mapCtaSubtitle:
        "اعثر على أماكن كردستان على خريطة واحدة. ابحث بالاسم وصفِّها حسب المحافظة والفئة.",
      openMap: "افتح الخريطة",
      website: "الموقع الإلكتروني",
      openingHours: "ساعات العمل",
      socialMedia: "وسائل التواصل",
    },
    places: {
      open24Hours: "مفتوح ٢٤ ساعة",
      closed: "مغلق",
    },
    header: {
      account: {
        signIn: "تسجيل الدخول",
        signOut: "تسجيل الخروج",
        signedInAs: "مسجّل الدخول باسم {{name}}",
        signInOrCreate: "تسجيل الدخول أو إنشاء حساب",
        menuLabel: "حسابك",
        signOutTitle: "تسجيل الخروج؟",
        signOutBody:
          "ستعود إلى الصفحة الرئيسية. تبقى رحلاتك المحفوظة كما هي — سجّل الدخول مرة أخرى في أي وقت لمتابعتها.",
        signOutCancel: "ابقَ مسجّل الدخول",
        signingOut: "جارٍ تسجيل الخروج…",
      },
    },
  },
  ckb: {
    auth: {
      eyebrow: "سەردانی کوردستان",
      emailLabel: "ئیمەیل",
      passwordLabel: "وشەی نهێنی",
      newPasswordLabel: "وشەی نهێنی نوێ",
      confirmPasswordLabel: "دڵنیاکردنی وشەی نهێنی",
      firstNameLabel: "ناو",
      lastNameLabel: "ناوی خێزان",
      showPassword: "پیشاندانی وشەی نهێنی",
      hidePassword: "شاردنەوەی وشەی نهێنی",
      passwordMismatch: "هەردوو وشەی نهێنی وەک یەک نین.",
      weakPassword: "ئەم وشەی نهێنییە هەر پێنج مەرجی خوارەوە تەواو نەکردووە.",
      backToSignIn: "گەڕانەوە بۆ چوونەژوورەوە",
      signInNow: "ئێستا بچۆ ژوورەوە",
      plannerNote:
        "«پلانی گەشتەکەت دابنێ» پلانەکانت لە هەژمارەکەتدا دەپارێزێت. بچۆ ژوورەوە یان هەژمارێک دروست بکە، ڕاستەوخۆ دەگەڕێیتەوە بۆی.",
      ruleMet: "تەواو",
      ruleUnmet: "هێشتا تەواو نەبووە",
      rules: {
        length: "لانیکەم ٨ پیت",
        uppercase: "یەک پیتی گەورەی لاتینی",
        lowercase: "یەک پیتی بچووکی لاتینی",
        number: "یەک ژمارە",
        symbol: "یەک هێما (# ? ! @ $ % ^ & * -)",
      },
      login: {
        seoTitle: "چوونەژوورەوە",
        panelTitle: "بەخێربێیتەوە.",
        panelBody:
          "بچۆ ژوورەوە تا گەشتەکانی پاشەکەوتکراو و هەڵبژاردەکانت لەگەڵت بمێننەوە لە کاتی گەشتکردن بە کوردستان.",
        title: "چوونەژوورەوە",
        newHere: "نوێی لێرە؟",
        createAccount: "هەژمارێک دروست بکە",
        forgot: "وشەی نهێنیت لەبیر چووە؟",
        submit: "چوونەژوورەوە",
        submitting: "خەریکی چوونەژوورەوە…",
        failed:
          "نەتوانرا بچیتە ژوورەوە. زانیارییەکانت بپشکنە و دووبارە هەوڵ بدە.",
      },
      signup: {
        seoTitle: "دروستکردنی هەژمار",
        panelTitle: "گەشتی داهاتووت بە شێوەی خۆت بکە.",
        panelBody:
          "هەژمارێکی بێبەرامبەر بۆ سەردانکەران، جیاواز لە داشبۆردی Visit Kurdistan و هیچ دەستپێگەیشتنی کارمەندی نادات.",
        title: "دروستکردنی هەژمار",
        haveAccount: "پێشتر هەژمارت هەیە؟",
        signIn: "چوونەژوورەوە",
        submit: "دروستکردنی هەژمار",
        submitting: "خەریکی دروستکردنی هەژمار…",
        checkEmail:
          "ئیمەیلەکەت بپشکنە بۆ پشتڕاستکردنەوەی هەژمارەکەت، دواتر بگەڕێوە و بچۆ ژوورەوە.",
        goToSignIn: "بڕۆ بۆ چوونەژوورەوە",
        failed: "نەتوانرا هەژمارەکەت دروست بکرێت. تکایە دووبارە هەوڵ بدە.",
      },
      forgot: {
        seoTitle: "ڕێکخستنەوەی وشەی نهێنی",
        panelTitle: "ناتوانی بچیتە ژوورەوە؟",
        panelBody:
          "ئەو ئیمەیلەمان بدە کە لەسەر هەژمارەکەتە، ئێمەش لینکێکی پارێزراو دەنێرین بۆ هەڵبژاردنی وشەی نهێنی نوێ.",
        title: "ڕێکخستنەوەی وشەی نهێنی",
        submit: "ناردنی لینکی ڕێکخستنەوە",
        submitting: "خەریکی ناردن…",
        sent: "ئەگەر هەژمارێک بەم ئیمەیلە هەبێت، لینکی ڕێکخستنەوەی وشەی نهێنیمان ناردووە. سندوقی نامە و فۆڵدەری نامەی ناخوازراو بپشکنە.",
        failed: "نەتوانرا ئیمەیلی ڕێکخستنەوە بنێردرێت. تکایە دووبارە هەوڵ بدە.",
      },
      reset: {
        seoTitle: "هەڵبژاردنی وشەی نهێنی نوێ",
        panelTitle: "وشەی نهێنی نوێ هەڵبژێرە.",
        panelBody:
          "شتێک هەڵبژێرە کە پێشتر لێرە بەکارت نەهێناوە. پاش پاشەکەوتکردنی، لە هەموو شوێنەکانی تر دەردەچی.",
        title: "دانانی وشەی نهێنی نوێ",
        submit: "پاشەکەوتکردنی وشەی نهێنی نوێ",
        submitting: "خەریکی پاشەکەوتکردن…",
        done: "وشەی نهێنیت ڕێکخرایەوە. ئێستا دەتوانی پێی بچیتە ژوورەوە.",
        noToken:
          "ئەم لینکی ڕێکخستنەوەی وشەی نهێنی تەواو نییە، ڕەنگە ئەپی ئیمەیلەکەت بڕیبێتی. لینکێکی نوێ داوا بکە و بە تەواوی بکەرەوە.",
        requestNew: "داواکردنی لینکی نوێ",
        failed:
          "نەتوانرا وشەی نهێنیت ڕێکبخرێتەوە، ڕەنگە لینک بەسەرچووبێت. تکایە لینکێکی نوێ داوا بکە.",
      },
      verify: {
        seoTitle: "پشتڕاستکردنەوەی ئیمەیل",
        panelTitle: "یەک هەنگاوی کۆتایی.",
        panelBody:
          "پشتڕاستکردنەوەی ئیمەیلەکەت دەریدەخات کە هەژمارەکە هی خۆتە و ڕێگەمان دەدات دەربارەی گەشتەکانت پەیوەندیت پێوە بکەین.",
        title: "پشتڕاستکردنەوەی ئیمەیلەکەت",
        checking: "خەریکی پشتڕاستکردنەوەی ئیمەیلەکەتین…",
        verified: "ئیمەیلەکەت پشتڕاست کرایەوە. ئێستا دەتوانی بچیتە ژوورەوە.",
        invalid: "ئەم لینکی پشتڕاستکردنەوە نادروستە یان بەسەرچووە.",
        noToken:
          "ئەم لینکی پشتڕاستکردنەوە تەواو نییە. ئیمەیلەکەت لە خوارەوە بنووسە و لینکێکی نوێ دەنێرین.",
        resend: "دووبارە ناردنی ئیمەیلی پشتڕاستکردنەوە",
        resending: "خەریکی ناردن…",
        resendHint: "ئەو ناونیشانەی لە کاتی دروستکردنی هەژمار بەکارت هێنا.",
        resent:
          "ئەگەر هەژمارێکی چاوەڕوان بەم ئیمەیلە هەبێت، لینکی پشتڕاستکردنەوەی نوێمان ناردووە.",
        resendFailed:
          "نەتوانرا ئیمەیلی پشتڕاستکردنەوەی نوێ بنێردرێت. تکایە دووبارە هەوڵ بدە.",
      },
      backToSite: "گەڕانەوە بۆ Visit Kurdistan",
      privacyPolicy: "سیاسەتی تایبەتمەندی",
    },
    chat: {
      launcherLabel: "یاریدەدەری سەردانی کوردستان بکەرەوە",
      title: "ڕێنمایی ماڵپەڕ",
      disclaimer:
        "یاریدەدەری زیرەکی دەستکرد. گفتوگۆکان بۆ باشترکردنی خزمەتگوزاری پاشەکەوت دەکرێن.",
      placeholder: "پێم بڵێ بەدوای چیدا دەگەڕێیت…",
      send: "ناردن",
      close: "داخستنی گفتوگۆ",
      dismiss: "شاردنەوە",
      thinking: "بیر دەکاتەوە",
      emptyTitle:
        "پێم بڵێ چی بۆ تۆ گرنگە و ڕێت پیشان دەدەم بۆ پەڕەی گونجاو. یەکێک لەمانە تاقی بکەرەوە:",
      suggestionsTitle: "پەڕەکان بۆ تۆ",
      alsoMentioned: "هەروەها باسکران، هێشتا پەڕەیان نییە",
      feedbackUp: "ئەم وەڵامە بەسوود بوو",
      feedbackDown: "ئەم وەڵامە بەسوود نەبوو",
      verificationUnavailable:
        "پشکنینی ئاسایش بەردەست نییە. تکایە دواتر هەوڵ بدەرەوە.",
      verificationPending: "پشکنینی ئاسایش بەردەوامە",
      verificationComplete: "پشکنینی ئاسایش تەواو بوو",
      starters: {
        threeDays: "بۆ کوێ بچم؟",
        whatsOn: "چ بۆنەیەک بەڕێوەیە؟",
        bestTime: "پاکێجە گەشتیارییەکانم پیشان بدە",
        newroz: "چ چالاکییەک هەیە؟",
      },
      types: {
        location: "شوێن",
        destination: "شار",
        event: "بۆنە",
        package: "پاکێج",
        story: "چیرۆک",
        faq: "پرسیاری دووبارە",
        discover: "بدۆزەرەوە",
        guide: "ڕێنما",
      },
      errors: {
        generic: "هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.",
        rateLimited:
          "گەیشتوویتە سنووری ١٠ پرسیار لە کاتژمێرێکدا. تکایە بەمزووانە دووبارە هەوڵ بدەرەوە.",
        rateLimitedWithWait:
          "گەیشتوویتە سنووری ١٠ پرسیار لە کاتژمێرێکدا. تکایە {{wait}} دووبارە هەوڵ بدەرەوە.",
        unavailable:
          "یاریدەدەر لە ئێستادا بەردەست نییە. تکایە دواتر هەوڵ بدەرەوە.",
        verification: "تکایە سەرەتا پشکنینی ئاسایش تەواو بکە.",
        inputBlocked:
          "تکایە پێش ناردن زمانێکی نەشیاو یان زانیاریی پەیوەندیی کەسی بسڕەوە.",
        unanswered:
          "پرسیارە دواییەکەت وەڵامی نەدرایەوە. گەڕێندرایەوە بۆ خانەی خوارەوە، دەتوانیت دووبارە بینێریت.",
      },
      feedbackThanks: "سوپاس بۆ ڕاوبۆچوونەکەت",
      clear: "سڕینەوەی گفتوگۆ",
    },
    tripPlanner: {
      eyebrow: "گەشتی کوردستانی تۆ",
      title: "پلانێک بۆ گەشتێک کە هی تۆیە.",
      intro:
        "پێشنیارێکی ئارام بە ڕۆژ، تەنها لەسەر شوێن و پاکێج و ڕووداوە دڵنیابووەکانی Visit Kurdistan.",
      inputBlocked:
        "تکایە پێش بەردەوامبوون زمانێکی نەشیاو یان زانیاریی پەیوەندیی کەسی بسڕەوە.",
      surprise: "شوێنە سەرەکییەکانم پێشان بدە",
      security: "پشکنینی ئاسایش تەواو بکە بۆ دروستکردنی پلانەکەت.",
      noOptions:
        "هەڵبژاردەکانی پلاندانان ئێستا بەردەست نین. تکایە دوواتر هەوڵ بدەوە.",
      error:
        "ئێستا نەمانتوانی گەشتەکەت دروست بکەین. هەڵبژاردنەکانت هێشتا لێرەن—تکایە دووبارە هەوڵ بدەوە.",
      tripDays: "ڕۆژ",
      mapTitle: "ڕێگای پێشنیارکراوی تۆ",
      showMap: "پیشاندانی نەخشە",
      hideMap: "شاردنەوەی نەخشە",
      mapLegend:
        "ڕۆژی {{day}}، بەو ڕیزبەندییەی سەردانیان دەکەیت ژمارە کراوە. خاڵە کاڵەکان بەشەکانی تری گەشتەکەن.",
      mapScopeTrip: "هەموو گەشتەکە",
      mapScopeDay: "ڕۆژی {{day}}",
      mapLegendTrip:
        "هەر {{count}} ڕۆژەکە بە ڕیزبەندی. هەر نیشانەیەک ڕۆژێکە، خاڵە بچووکەکانیش وێستگەکانیەتی.",
      mapStart: "دەستپێک",
      mapEnd: "کۆتایی",
      saved: {
        title: "لەوێوە بەردەوام بە کە وەستایت",
        subtitle:
          "ئەو گەشتانەی بەم هەژمارە پلانت بۆ داناون. یەکێکیان بکەرەوە بۆ خوێندنەوە یان بەردەوامبوون لە گۆڕینی.",
        open: "ئەم گەشتە بکەرەوە",
        days: "{{count}} ڕۆژ",
        deleteNamed: "سڕینەوەی {{title}}",
        confirmDelete: "بیسڕەوە",
        cancel: "بیهێڵەوە",
        deleting: "خەریکی سڕینەوەیە…",
        deleteFailed: "ئەم گەشتە نەسڕایەوە. دوای ساتێک دووبارە هەوڵ بدەرەوە.",
        failed: "گەشتە پاشەکەوتکراوەکانت بار نەبوون.",
        retry: "دووبارە هەوڵ بدەرەوە",
        showAll: "هەموو {{count}} پیشان بدە",
      },
      recommendations: "لەوانەیە ئەمانەش بە دڵت بن",
      newTrip: "گەشتێکی نوێ پلان بکە",
      anotherTrip: "گەشتێکی تر پلان دەکەیت؟",
      edit: "گۆڕینی وەڵامەکانم",
      day: "ڕۆژ",
      noStops: "کاتێکی ئازاد بۆ گەڕان بە ئارامی.",
      why: "بۆچی گونجاوە",
      stopAbout: "دەربارەی ئەم شوێنە",
      stopHide: "شاردنەوە",
      freeDay: "کاتی ئازاد ڕێگاکەی ئارامتر دەکات.",
      startDate: "بەرواری دەستپێک",
      endDate: "بەرواری کۆتایی",
      loading: "خەریکی بارکردنی پلاندانەری گەشتە…",
      loadingSaved: "خەریکی کردنەوەی گەشتی پاشەکەوتکراوت…",
      savedGoneTitle: "ئەم لینکی گەشتە چیتر کارا نییە.",
      savedGoneBody:
        "ڕەنگە ئەو گەشتیارەی دروستی کردووە سڕیبێتییەوە. دەتوانی لە ماوەی دوو خولەک گەشتێکی نوێ پلان بکەی.",
      travellerTypes: {
        solo: "تەنها خۆم",
        couple: "دوو کەس",
        family: "خێزان",
        friends: "هاوڕێیان",
      },
      travelStyles: {
        "single-base": {
          label: "مانەوە لە یەک ناوچە",
          hint: "گەشتی کورت، یەک جێگای مانەوە",
        },
        touring: {
          label: "گەڕان بە نێو شارەکاندا",
          hint: "بینینی زیاتر، گەشتی زیاتر",
        },
      },
      pills: {
        events: "بۆنەکان لەخۆدەگرێت",
      },
      chat: {
        progress: "{{done}} لە {{total}}",
        change: "گۆڕین: {{question}}",
        ready: "ئەمە هەموو ئەوەیە پێویستمە. پلانی گەشتەکەت ئامادە بکەم؟",
        build: "پلانی گەشتەکەم ئامادە بکە",
        building: "خەریکی ئامادەکردنی پلانی گەشتەکەتم…",
        buildAnytime:
          "ئەمە بەسە بۆ ئامادەکردنی گەشتەکەت. ئەوانی تر ئارەزوومەندانەن — وەڵامی ئەوە بدەرەوە کە دەتەوێت، یان ئێستا دەست پێ بکە.",
        skipQuestion: "تێپەڕاندن",
        skipped: "بەسەریدا چوو",
        answerNow: "وەڵام بدەرەوە: {{question}}",
        dates: {
          prompt:
            "کەی دێی؟ بەروارەکانت درێژی گەشتەکە و ئەو بۆنانە دیاری دەکەن کە دەتوانم بخەمە ناوی.",
          presets: {
            weekend: "کۆتایی هەفتەیەکی درێژ",
            week: "نزیکەی هەفتەیەک",
            tenDays: "دە ڕۆژ",
          },
          presetNights: "{{count}} ڕۆژ",
          orPick: "یان بەرواری دیاریکراو هەڵبژێرە",
          confirm: "ئەم بەروارانە بەکاربهێنە",
          length: "{{count}} ڕۆژ",
          answer: "{{count}} ڕۆژ، لە {{start}} بۆ {{end}}",
        },
        travellerType: {
          prompt: "کێ گەشت دەکات؟",
        },
        groupSize: {
          prompt: "بە گشتی چەند کەسن؟",
          more: "یان ژمارەیەک بنووسە (تا {{max}})",
          confirm: "ئەمە ژمارەمانە",
          answer: "{{count}} گەشتیار",
        },
        arrival: {
          prompt: "بۆ کام فڕگە دێی؟",
          unsure: "هێشتا دڵنیا نیم",
        },
        travelStyle: {
          prompt:
            "پێت باشترە لە یەک ناوچە بمێنیتەوە یان بە نێو شارەکاندا بگەڕێی؟",
        },
        destination: {
          prompt: "لە کام ناوچە حەز دەکەی بمێنیتەوە؟",
          anywhere: "هەر شوێنێک کە پێشنیاری بکەی",
        },
        locationCategory: {
          prompt: "زیاتر حەز دەکەیت کام جۆرە شوێنانە بگەڕێیت؟",
        },
        interests: {
          prompt:
            "چی ئەم گەشتە لەبیرنەکراو دەکات؟ تا شەش هەڵبژێرە، یان بەسەریدا بڕۆ و من گرنگترینەکان هەڵدەبژێرم.",
          more: "{{n}} زیاتر",
          skip: "تەنها گرنگترینەکان پیشانم بدە",
          count: "{{count}} لە {{max}} هەڵبژێردراوە",
          noPreference: "گرنگترینەکان",
        },
        events: {
          prompt:
            "ئەو فێستیڤاڵ و بۆنانە کە لە بەرواری تۆدا ڕوودەدەن بخەمە ناوی؟",
          yes: "بەڵێ، بخەیانە ناوی",
          no: "نا، تەنها شوێنەکان",
        },
        notes: {
          prompt:
            "شتێکی تر هەیە پێویست بێت بزانم؟ یەک ڕستە بەسە — گەشت لەگەڵ منداڵی بچووک، ئۆتۆمبێلی بەکرێگیراو، یان شتێک کە حەز ناکەی.",
          label: "هەر شتێکی تر کە پێویستە بزانم",
          placeholder:
            "لەگەڵ دایک و باوکم گەشت دەکەین، و یەکێکیان کورسی چەرخدار بەکاردەهێنێت.",
          send: "ناردن",
          skip: "شتێک نییە زیادی بکەم",
          skipped: "شتێک نییە زیادی بکەم",
        },
      },
      refine: {
        title: "دەتەوێت شتێک بگۆڕی؟",
        intro:
          "بە وشەکانی خۆت پێم بڵێ و من ئەم پلانە دەگۆڕم — ئەوانی تر وەک خۆی دەمێنێت.",
        label: "چی دەتەوێت بگۆڕی؟",
        placeholder: "ڕۆژی دووەم سووکتر بکە…",
        apply: "گەشتەکەم بگۆڕە",
        applying: "خەریکی گۆڕینی گەشتەکەتم…",
        left: "{{count}} گۆڕانکاری ماوە",
        exhausted:
          "ئەم گەشتە بەو ئەندازەی کە دەتوانم گۆڕدراوە. ئەگەر دەتەوێت بەردەوام بی، پلانێکی نوێ دەست پێ بکە.",
        failed: "نەتوانرا گەشتەکەت بگۆڕدرێت. تکایە دووبارە هەوڵ بدە.",
        suggestions: {
          lighter: "ڕۆژی دووەم سووکتر بکە",
          moreFood: "خواردن و بازاڕی زیاتر",
          moreOutdoors: "کاتی زیاتر لە دەرەوە",
          swapDay: "ڕۆژی کۆتایی بە شتێکی ئارامتر بگۆڕە",
        },
      },
      share: {
        saved: "لە هەژمارەکەت پاشەکەوت کرا — ئەم لینکە دواتریش کار دەکات.",
        notSaved:
          "پلانەکە دروست کرا بەڵام نەتوانرا پاشەکەوت بکرێت، بۆیە لینکی هاوبەشکردن نییە. ئەگەر دەتەوێت بمێنێت، چاپی بکە.",
        urlLabel: "لینکی ئەم گەشتە",
        copy: "کۆپیکردنی لینک",
        copied: "کۆپی کرا",
      },
      opener: {
        prompt:
          "بە وشەکانی خۆت دەربارەی گەشتەکەت پێم بڵێ، منیش ئەوەی بتوانم پڕی دەکەمەوە. یان بەسەریدا بڕۆ و من پرسیارت لێ دەکەم.",
        label: "گەشتەکەت باس بکە",
        placeholder:
          "پێنج ڕۆژ لە تشرینی یەکەم لەگەڵ منداڵەکانم، بۆ فڕگەی هەولێر دێین، زیاتر سروشت و خواردن…",
        examplesLabel: "بۆ نموونە:",
        examples: {
          family:
            "هەفتەیەک لە تشرینی یەکەم لەگەڵ دوو منداڵم، بۆ هەولێر دێین، زیاتر سروشت و پیاسەی ئاسان",
          couple:
            "کۆتایی هەفتەیەکی درێژ بۆ هەردووکمان، مانەوە لە سلێمانی، خواردن و مێژوو",
          solo: "دە ڕۆژ بە تەنها و گەڕان بە نێو شارەکاندا، ئۆتۆمبێلێکی بەکرێگیراوم هەیە",
        },
        submit: "لەمەوە پلان دابنێ",
        reading: "خەریکی خوێندنەوەی تێبینییەکانتم…",
        skip: "تەنها پرسیارەکان لێم بکە",
        understood_one:
          "تێگەیشتم — یەک شت وەرگرتم. لێی بدە بۆ گۆڕینی، منیش لەسەر ئەوانی تر پرسیار دەکەم.",
        understood_other:
          "تێگەیشتم — ئەمە ئەوەیە کە وەرمگرت. لە هەر شتێک بدە بۆ گۆڕینی، منیش لەسەر ئەوانی تر پرسیار دەکەم.",
        unmatched:
          "نەتوانرا {{items}} لەگەڵ ئەوەی ئێمە پۆشینی دەکەین بگونجێت، بۆیە بەلاوەم ناوە. هەموو ئەوانی تر لە خوارەوەن.",
        failed:
          "نەتوانرا ئەوە بخوێنرێتەوە. دەتوانی دووبارە هەوڵ بدەی، یان لەبری ئەوە وەڵامی پرسیارەکان بدەیەوە.",
      },
      packages: {
        eyebrow: "ئامادەیە بۆ حیجزکردن",
        title: "پاکێجەکانی گونجاو لەگەڵ ئەم گەشتە",
        closeTitle: "نزیکترین پاکێجەکانی ئێمە",
        closeBadge: "نزیکترین",
        kindPackage: "پاکێج",
        kindEvent: "چالاکی",
        nights_one: "{{count}} شەو",
        nights_other: "{{count}} شەو",
      },
      contact: {
        eyebrow: "شتێکی تر لە مێشکتدایە؟",
        title: "پێمان بڵێ چیت دەوێت",
        body: "ئەگەر ڕێبەرێکی تایبەت یان ڕێڕەوێکی جیاواز یان گەشتێکی تایبەت بە داواکارییەکەت دەوێت، پەیوەندیمان پێوە بکە و بۆت ڕێک دەخەین.",
        cta: "پەیوەندیمان پێوە بکە",
      },
      essentials: {
        food: {
          title: "برسیتە؟",
          body: "خواردنە کوردییەکان و تامە ناوخۆییەکان بدۆزەرەوە و لە گەشتەکەتدا چێژیان لێ ببینە.",
          cta: "تامی کوردستان بدۆزەرەوە",
        },
        stay: {
          title: "بەدوای شوێنێکدا دەگەڕێیت بۆ مانەوە؟",
          body: "هاوینەهەوارەکان بدۆزەرەوە بۆ پشوویەکی ئارام لە گەشتەکەتدا.",
          cta: "هاوینەهەوارەکان ببینە",
        },
      },
    },
    exploreMap: {
      eyebrow: "لەسەر نەخشە",
      title: "کوردستان لەسەر نەخشە بگەڕێ",
      intro:
        "هەموو ئەو شوێنانەی باسیان دەکەین، لە یەک شوێندا دیاری کراون. بەدوای حەزی زانینتدا لە هەموو کوردستاندا بگەڕێ.",
      governorate: "پارێزگا",
      all: "هەموو",
      seasons: {
        all: "هەموو وەرزەکان",
        spring: "بەهار",
        summer: "هاوین",
        autumn: "پایز",
        winter: "زستان",
      },
      count: "{{total}} شوێن",
      count_one: "{{total}} شوێن",
      noPlaces: "هێشتا هیچ شوێنێک لەگەڵ ئەم فلتەرانە ناگونجێت.",
      clearFilters: "سڕینەوەی فلتەرەکان",
      viewPlace: "بینینی شوێن",
      closeCard: "داخستن",
      directions: "ڕێگا",
      share: "هاوبەشکردن",
      linkCopied: "بەستەرەکە کۆپی کرا",
      bestTime: "باشترین کات بۆ سەردان",
      inSeason: "ئێستا کاتی گونجاوە",
      about: "دەربارە",
      readMore: "زیاتر بخوێنەوە",
      readLess: "کەمتر پیشان بدە",
      today: "ئەمڕۆ",
      openNow: "ئێستا کراوەیە",
      closedNow: "ئێستا داخراوە",
      closedToday: "ئەمڕۆ داخراوە",
      closesAt: "{{time}} دادەخرێت",
      opensAt: "{{time}} دەکرێتەوە",
      distanceAway: "{{distance}} کم لە تۆوە دوورە",
      previous: "شوێنی پێشوو",
      next: "شوێنی دواتر",
      position: "{{current}} لە {{total}}",
      expandDetails: "وردەکاری زیاتر پیشان بدە",
      collapseDetails: "وردەکاری کەمتر پیشان بدە",
      photos: "وێنەکان",
      showPhoto: "وێنەی {{number}} پیشان بدە",
      searchLabel: "بە ناو بەدوای شوێندا بگەڕێ",
      searchPlaceholder: "بەدوای شوێندا بگەڕێ",
      clearSearch: "سڕینەوەی گەڕان",
      filters: "فلتەرەکان",
      category: "پۆل",
      clearAll: "سڕینەوەی هەموو",
      results: "شوێنەکان لەسەر نەخشە",
      showList: "لیستەکە پیشان بدە",
      hideList: "لیستەکە بشارەوە",
      allGovernorates: "هەموو پارێزگاکان",
      cluster: "{{count}} شوێن لێرەیە. نەخشەکە گەورە بکە بۆ بینینیان",
      mapUnavailable:
        "ئەم وێبگەڕە ناتوانێت نەخشەکە پیشان بدات. لیستەکە هێشتا هەموو شوێنەکانی تێدایە.",
      details: "وردەکاری",
      ctaTitle: "گەشتێکی تایبەت بە خۆت دابڕێژە",
      ctaSubtitle:
        "لەگەڵ پسپۆڕانی گەشتی ئێمە کار بکە بۆ داڕشتنی ئەزموونێکی تایبەتی کوردستان کە گونجاو بێت لەگەڵ خولیا، کات و بودجەکەت.",
      ctaPrimaryLabel: "پلانی گەشتەکەت دابنێ",
      ctaSecondaryLabel: "پەیوەندیمان پێوە بکە",
    },
    turnstile: {
      unavailable: "پشکنینی ئاسایش بەردەست نییە. تکایە دواتر هەوڵ بدەرەوە.",
      expired: "پشکنینی ئاسایش بەسەرچوو. تکایە دووبارە تەواوی بکەرەوە.",
      timedOut: "کاتی پشکنینی ئاسایش تەواوبوو. تکایە دووبارە هەوڵ بدەرەوە.",
      failed:
        "نەتوانرا پشکنینی ئاسایش تەواو بکرێت. تکایە دووبارە هەوڵ بدەرەوە.",
      loadFailed:
        "نەتوانرا پشکنینی ئاسایش باربکرێت. تکایە پەڕەکە نوێ بکەرەوە و دووبارە هەوڵ بدەرەوە.",
    },
    destinations: {
      mapCtaTitle: "هەموو شوێنەکان لەسەر نەخشە ببینە",
      mapCtaSubtitle:
        "شوێنەکانی کوردستان لەسەر یەک نەخشە ببینە. بە ناو بگەڕێ و بەپێی پارێزگا و پۆل فلتەریان بکە.",
      openMap: "نەخشەکە بکەرەوە",
      website: "ماڵپەر",
      openingHours: "کاتەکانی کردنەوە",
      socialMedia: "تۆڕی کۆمەڵایەتی",
    },
    places: {
      open24Hours: "٢٤ کاتژمێر کراوەیە",
      closed: "داخراوە",
    },
    header: {
      account: {
        signIn: "چوونەژوورەوە",
        signOut: "چوونەدەرەوە",
        signedInAs: "چووی ژوورەوە وەک {{name}}",
        signInOrCreate: "چوونەژوورەوە یان دروستکردنی هەژمار",
        menuLabel: "هەژمارەکەت",
        signOutTitle: "دەرچوون؟",
        signOutBody:
          "دەگەڕێیتەوە بۆ پەڕەی سەرەکی. گەشتە پاشەکەوتکراوەکانت دەمێننەوە — هەر کاتێک بتەوێت دیسان بچۆ ژوورەوە بۆ بەردەوامبوون.",
        signOutCancel: "لە ژوورەوە بمێنەوە",
        signingOut: "دەرچوون…",
      },
    },
  },
} as const;
