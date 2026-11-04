#!/usr/bin/env node
/**
 * Copies the website's strings for the features the app shares with it
 * (accounts, chat, trip planner, map) into src/i18n/web-messages.ts.
 *
 *   node scripts/sync-web-messages.mjs [path-to-vk-frontend-v2]
 *
 * Defaults to a sibling checkout at ../vk-frontend-v2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const website = resolve(process.argv[2] ?? join(root, "..", "vk-frontend-v2"));
const messages = join(website, "src", "i18n", "messages");

/** Namespace → the keys to keep (null keeps the whole namespace). */
const PICK = {
  auth: null,
  chat: null,
  tripPlanner: null,
  exploreMap: null,
  turnstile: null,
  destinations: [
    "mapCtaTitle",
    "mapCtaSubtitle",
    "openMap",
    "website",
    "openingHours",
    "socialMedia",
  ],
  places: ["open24Hours", "closed"],
  header: ["account"],
};

/** Website-only keys the app has no use for. */
const OMIT = {
  exploreMap: [
    "seoTitle",
    "seoDescription",
    "miniMap",
    "fullscreen",
    "exitFullscreen",
    "moreCategories",
    "previousCategories",
  ],
  tripPlanner: ["limit", "print"],
};

const out = {};
for (const locale of ["en", "ar", "ckb"]) {
  const source = JSON.parse(
    readFileSync(join(messages, `${locale}.json`), "utf8"),
  );
  const picked = {};
  for (const [namespace, keys] of Object.entries(PICK)) {
    let value = source[namespace] ?? {};
    if (keys)
      value = Object.fromEntries(
        keys.filter((key) => key in value).map((key) => [key, value[key]]),
      );
    else value = { ...value };
    for (const key of OMIT[namespace] ?? []) delete value[key];
    if (namespace === "tripPlanner") {
      value.pills = { events: value.pills?.events ?? "" };
      const { accessibility: _legacy, ...chat } = value.chat ?? {};
      value.chat = chat;
    }
    picked[namespace] = value;
  }
  out[locale] = picked;
}

const header = `/**
 * Strings shared with the website, copied from
 * vk-frontend-v2/src/i18n/messages/{en,ar,ckb}.json so the app reads exactly
 * like the site in every language. Regenerate with
 * \`node scripts/sync-web-messages.mjs\` rather than hand-editing: an empty
 * string falls back to English, as on the website.
 */
`;
writeFileSync(
  join(root, "src", "i18n", "web-messages.ts"),
  `${header}export const webMessages = ${JSON.stringify(out, null, 2)} as const;\n`,
);
console.log("Wrote src/i18n/web-messages.ts");
