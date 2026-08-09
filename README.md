# Visit Kurdistan mobile

An Expo / React Native companion app for the existing Visit Kurdistan website.
It reads the existing public API, so destinations, locations, events and stories
continue to be managed only through the current dashboard.

## Run locally

```bash
cp .env.example .env
npm install
npm run ios
# or: npm run android
```

Before a production build, set both `EXPO_PUBLIC_API_URL` and
`EXPO_PUBLIC_WEBSITE_URL` to the matching production services.

For Android's native Nearby map, create a restricted Google Maps Android API
key for `com.visitkurdistan.mobile` and its build SHA-1 fingerprint, then add
it as `android.config.googleMaps.apiKey` in `app.json` before making a new
internal build. Apple Maps needs no API key on iOS. The map, location access,
and remote push notifications require a development or preview build; they are
not fully available in Expo Go.

## Initial product scope

- Explore: CMS-driven hero, featured destinations, packages, events and stories
- Discover: search and filter destinations, places, events, packages and stories
- Detail: full public CMS content, opening hours, destination context, external
  links and a device map action where coordinates are present
- Saved: a persistent on-device journey list
- Account: secure device storage for an existing Visit Kurdistan account session
- Trip assistant: persistent conversation history, dashboard-managed starter
  prompts and the existing Turnstile-protected chat API

## Architecture

```
src/
├── App.tsx          Native application composition and navigation state
├── api/             API client functions grouped by backend domain
├── components/      Shared native UI; chat and account UI are grouped here
├── config/          Public application configuration
├── hooks/           Reusable React hooks for content data
├── i18n/            Locale types, language options and labels
├── lib/             Device-storage and framework-independent helpers
├── routes/          Page-level native UI grouped by website route area
│   ├── home/
│   ├── destinations/
│   ├── discover/
│   ├── details/
│   └── contact/
└── styles/          Shared native design tokens
```

The root `App.tsx` is intentionally only the Expo entry point; `src/App.tsx`
owns composition. This mirrors the website structure: route-specific UI lives
under `routes`, reusable native UI under `components`, network calls under
`api`, and app-wide helpers in `lib`, `hooks`, `i18n`, and `styles`.

## Turnstile verification

Chat and contact verification run inside the native app's secure WebView sheet;
they do not redirect users to the public website. Set the public website origin
and Turnstile site key in `.env` for the intended environment.

## Production checks and releases

```bash
npm run format:check
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform ios
```

The same checks run in GitHub Actions on pull requests and `main`. EAS profiles
are in `eas.json`; once the Expo, Apple, and Google accounts are connected, use
`npx eas-cli@latest build --profile preview` for internal testing and
`npx eas-cli@latest build --profile production` for store-ready binaries.

## Native links

The app handles links in this form and opens the native detail screen:

```text
visitkurdistan://content/place/dolma
visitkurdistan://content/destination/erbil
```

The Android system back button now closes sheets and detail/browse screens
before leaving the application.

The visual system mirrors the website: deep purple `#36196D`, ivory cream,
lime highlights, editorial type hierarchy and 28–36px rounded image cards.

# vk-mobile
