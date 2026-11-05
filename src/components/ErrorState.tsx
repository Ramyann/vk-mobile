import type { AppLocale } from "../i18n/locale";
import { ta } from "../i18n/app-messages";
import { EmptyState } from "./EmptyState";

/** A failed load, in the empty-state layout, with a retry action. */
export function ErrorState({
  title,
  detail,
  locale = "en",
  onRetry,
}: {
  title?: string;
  detail: string;
  locale?: AppLocale;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={title ?? ta(locale, "errorTitle")}
      detail={detail}
      action={{
        label: ta(locale, "tryAgain"),
        onPress: onRetry,
        kind: "primary",
      }}
    />
  );
}
