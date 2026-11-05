import { EmptyState } from "./EmptyState";

/** A failed load, in the empty-state layout, with a retry action. */
export function ErrorState({
  title = "Unable to load this right now",
  detail,
  onRetry,
}: {
  title?: string;
  detail: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={title}
      detail={detail}
      action={{ label: "Try again", onPress: onRetry, kind: "primary" }}
    />
  );
}
