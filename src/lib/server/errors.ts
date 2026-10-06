import type { ApiErrorCode } from "@/lib/types";

/**
 * Typed domain errors thrown by services. Routes map them to the ApiError
 * envelope in one place (http.ts); anything else is an unexpected failure.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ApiErrorCode;
}

export class InvalidRequestError extends DomainError {
  readonly code = "invalid_request";
}

export class NotFoundError extends DomainError {
  readonly code = "not_found";
}

export class ConflictError extends DomainError {
  readonly code = "conflict";
}

export class AiUnavailableError extends DomainError {
  readonly code = "ai_unavailable";
}
