/** Public runtime configuration. Values must be safe to embed in the app. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://dev-api.vkstgpermits.com/api";
export const WEBSITE_URL =
  process.env.EXPO_PUBLIC_WEBSITE_URL ?? "https://frontend.vkstgpermits.com";
