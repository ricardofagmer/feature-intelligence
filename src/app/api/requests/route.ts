import type { CreateRequestResponse, ListRequestsResponse } from "@/lib/types";
import { handleRouteError, jsonOk, parseWith, readJsonBody } from "@/lib/server/http";
import { createRequestBodySchema, listRequestsQuerySchema } from "@/lib/server/schemas";
import { createRequest, listRequests } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    // Empty params (`?status=`) mean "no filter", not an invalid value.
    const entries = [...new URL(request.url).searchParams.entries()].filter(([, value]) => value !== "");
    const query = parseWith(listRequestsQuerySchema, Object.fromEntries(entries));
    const body: ListRequestsResponse = {
      requests: listRequests({ status: query.status, themeId: query.theme, sort: query.sort, q: query.q }),
    };
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "GET /api/requests");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await readJsonBody(request, createRequestBodySchema);
    const body: CreateRequestResponse = await createRequest(input);
    return jsonOk(body, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/requests");
  }
}
