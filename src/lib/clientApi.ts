import type {
  ApiErrorCode,
  BriefResponse,
  CreateRequestBody,
  CreateRequestResponse,
  ReviewActionBody,
  ReviewItem,
  VoteResponse,
} from "@/lib/types";

/** Synchronous triage and brief generation call the model, so they get a longer budget than a vote. */
const DEFAULT_TIMEOUT_MS = 15_000;
const AI_TIMEOUT_MS = 90_000;

const API_ERROR_CODES: readonly ApiErrorCode[] = [
  "invalid_request",
  "not_found",
  "conflict",
  "ai_unavailable",
  "internal",
];

export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;

  constructor(options: { code: ApiErrorCode; statusCode: number; message: string }) {
    super(options.message);
    this.name = "ApiRequestError";
    this.code = options.code;
    this.statusCode = options.statusCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && API_ERROR_CODES.some((code) => code === value);
}

function hasKeys<T extends object>(value: unknown, keys: readonly (keyof T & string)[]): value is T {
  return isRecord(value) && keys.every((key) => key in value);
}

function toApiError(statusCode: number, body: unknown): ApiRequestError {
  if (isRecord(body) && isApiErrorCode(body.code)) {
    const message = typeof body.message === "string" ? body.message : "Request failed.";
    return new ApiRequestError({ code: body.code, statusCode, message });
  }
  const code: ApiErrorCode =
    statusCode === 404 ? "not_found" : statusCode === 409 ? "conflict" : "internal";
  return new ApiRequestError({ code, statusCode, message: "The server returned an unexpected error." });
}

async function postJson(path: string, options: { body?: unknown; timeoutMs?: number }): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiRequestError({
      code: "internal",
      statusCode: 0,
      message: timedOut
        ? "The server took too long to respond. Please try again."
        : "Could not reach the server. Check your connection and try again.",
    });
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw toApiError(response.status, body);
  }
  return body;
}

function expectShape<T extends object>(body: unknown, keys: readonly (keyof T & string)[]): T {
  if (!hasKeys<T>(body, keys)) {
    throw new ApiRequestError({
      code: "internal",
      statusCode: 200,
      message: "The server response was not in the expected format.",
    });
  }
  return body;
}

export async function createRequest(body: CreateRequestBody): Promise<CreateRequestResponse> {
  const data = await postJson("/api/requests", { body, timeoutMs: AI_TIMEOUT_MS });
  return expectShape<CreateRequestResponse>(data, ["request", "triageSummary"]);
}

export async function voteForRequest(requestId: number, voter: string): Promise<VoteResponse> {
  const data = await postJson(`/api/requests/${requestId}/votes`, { body: { voter } });
  return expectShape<VoteResponse>(data, ["supportCount"]);
}

export async function retriageRequest(requestId: number): Promise<CreateRequestResponse> {
  const data = await postJson(`/api/requests/${requestId}/retriage`, { timeoutMs: AI_TIMEOUT_MS });
  return expectShape<CreateRequestResponse>(data, ["request", "triageSummary"]);
}

export async function resolveReviewItem(
  itemId: number,
  action: ReviewActionBody["action"],
): Promise<{ item: ReviewItem }> {
  const body: ReviewActionBody = { action };
  const data = await postJson(`/api/review/${itemId}`, { body });
  return expectShape<{ item: ReviewItem }>(data, ["item"]);
}

export async function generateBrief(themeId: number): Promise<BriefResponse> {
  const data = await postJson(`/api/themes/${themeId}/brief`, { timeoutMs: AI_TIMEOUT_MS });
  return expectShape<BriefResponse>(data, ["brief"]);
}

/** User-facing copy for a failed call; switches on the stable code, never on server prose. */
export function describeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiRequestError)) return fallback;
  switch (error.code) {
    case "invalid_request":
      return error.message;
    case "ai_unavailable":
      return "The AI service is unavailable right now. Nothing was lost — try again in a moment.";
    case "not_found":
      return "This item no longer exists. Refresh the page to see the latest state.";
    case "conflict":
      return "This was already done.";
    case "internal":
      return error.statusCode === 0 || error.statusCode === 200 ? error.message : fallback;
  }
}
