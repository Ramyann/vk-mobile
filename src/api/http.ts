/**
 * An API failure with what the backend said about it. Nest errors are not
 * wrapped in `{ count, data }`: they arrive as `{ statusCode, message, code? }`,
 * and a validation 400 sends `message` as a list.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiErrorFrom(
  response: Response,
  fallback: string,
): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object")
      body = parsed as Record<string, unknown>;
  } catch {
    // A proxy error page or empty body; the fallback message is used.
  }
  const raw = body.message;
  const message = Array.isArray(raw)
    ? raw.filter((part) => typeof part === "string").join(" ")
    : typeof raw === "string"
      ? raw
      : "";
  const header = Number(response.headers.get("Retry-After"));
  const retryAfter =
    typeof body.retryAfterSeconds === "number"
      ? body.retryAfterSeconds
      : Number.isFinite(header) && header > 0
        ? header
        : undefined;
  return new ApiError(
    message || fallback,
    response.status,
    typeof body.code === "string" ? body.code : undefined,
    retryAfter,
  );
}

/** Every successful JSON response is wrapped as `{ count, data }`. */
export const unwrapData = <T>(payload: unknown): T =>
  payload && typeof payload === "object" && "data" in payload
    ? (payload as { data: T }).data
    : (payload as T);

export const isInputBlocked = (error: unknown) =>
  error instanceof ApiError && error.code === "INPUT_NOT_ALLOWED";
