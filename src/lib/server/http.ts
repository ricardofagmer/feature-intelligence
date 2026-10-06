import type { z } from "zod";
import type { ApiError, ApiErrorCode } from "@/lib/types";
import { DomainError, InvalidRequestError } from "@/lib/server/errors";
import { MAX_BODY_BYTES, idParamSchema } from "@/lib/server/schemas";

/** Route-handler plumbing: the ApiError envelope, body parsing, and the single error-mapping point. */

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  invalid_request: 400,
  not_found: 404,
  conflict: 409,
  ai_unavailable: 503,
  internal: 500,
};

export function jsonOk<T>(body: T, status = 200): Response {
  return Response.json(body, { status });
}

export function jsonError(code: ApiErrorCode, message: string, statusCode = STATUS_BY_CODE[code]): Response {
  const body: ApiError = { statusCode, code, message };
  return Response.json(body, { status: statusCode });
}

function describeIssues(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

export function parseWith<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new InvalidRequestError(describeIssues(parsed.error));
  return parsed.data;
}

/** Reads a JSON body with a hard size cap, then validates it against the schema. */
export async function readJsonBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (declaredLength > MAX_BODY_BYTES) throw new InvalidRequestError("Request body is too large.");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) throw new InvalidRequestError("Request body is too large.");
  let value: unknown;
  try {
    value = text.length === 0 ? {} : JSON.parse(text);
  } catch {
    throw new InvalidRequestError("Request body must be valid JSON.");
  }
  return parseWith(schema, value);
}

export async function readIdParam(params: Promise<{ id: string }>): Promise<number> {
  const { id } = await params;
  return parseWith(idParamSchema, id);
}

/** The one place errors become responses. Unknown errors are logged server-side and never leak detail. */
export function handleRouteError(error: unknown, route: string): Response {
  if (error instanceof DomainError) return jsonError(error.code, error.message);
  console.error(
    JSON.stringify({
      event: "unhandled_route_error",
      route,
      error: error instanceof Error ? `${error.name}: ${error.message}` : "non-error thrown",
    }),
  );
  return jsonError("internal", "An unexpected error occurred.");
}
