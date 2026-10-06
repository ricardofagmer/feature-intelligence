import type { RequestDetailResponse } from "@/lib/types";
import { handleRouteError, jsonError, jsonOk, readIdParam } from "@/lib/server/http";
import { getRequestDetail } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const id = await readIdParam(params);
    const body: RequestDetailResponse | null = getRequestDetail(id);
    return body ? jsonOk(body) : jsonError("not_found", `Request ${id} was not found.`);
  } catch (error) {
    return handleRouteError(error, "GET /api/requests/[id]");
  }
}
