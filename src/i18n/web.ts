import type { AppLocale } from "./locale";
import { webMessages } from "./web-messages";

type Vars = Record<string, string | number>;

function lookup(tree: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, key) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[key]
          : undefined,
      tree,
    );
}

function pick(locale: AppLocale, path: string): string | undefined {
  const value = lookup(webMessages[locale], path);
  return typeof value === "string" && value ? value : undefined;
}

/**
 * The website's i18next keys, resolved for the app: `{{name}}` interpolation,
 * `_one` / `_other` plurals when `count` is passed, and English fallback for a
 * string the translators left empty.
 */
export function tw(locale: AppLocale, path: string, vars: Vars = {}): string {
  const plural =
    typeof vars.count === "number"
      ? `${path}_${vars.count === 1 ? "one" : "other"}`
      : undefined;
  const template =
    (plural && (pick(locale, plural) ?? pick("en", plural))) ??
    pick(locale, path) ??
    pick("en", path) ??
    path;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** A translator bound to one locale, for components. */
export const webT =
  (locale: AppLocale) =>
  (path: string, vars?: Vars): string =>
    tw(locale, path, vars);
