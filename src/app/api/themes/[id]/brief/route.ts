import type { BriefResponse } from "@/lib/types";
import { handleRouteError, jsonError, jsonOk, readIdParam } from "@/lib/server/http";
import { createBrief, getLatestBrief } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const themeId = await readIdParam(params);
    const brief = getLatestBrief(themeId);
    if (!brief) return jsonError("not_found", `No brief exists for theme ${themeId}.`);
    const body: BriefResponse = { brief };
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "GET /api/themes/[id]/brief");
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const themeId = await readIdParam(params);
    const body: BriefResponse = { brief: await createBrief(themeId) };
    return jsonOk(body, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/themes/[id]/brief");
  }
}
