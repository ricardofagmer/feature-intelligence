import type { CreateRequestResponse } from "@/lib/types";
import { handleRouteError, jsonOk, readIdParam } from "@/lib/server/http";
import { retriage } from "@/lib/server/services";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const id = await readIdParam(params);
    const body: CreateRequestResponse = await retriage(id);
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "POST /api/requests/[id]/retriage");
  }
}
