import type { VoteResponse } from "@/lib/types";
import { handleRouteError, jsonOk, readIdParam, readJsonBody } from "@/lib/server/http";
import { voteBodySchema } from "@/lib/server/schemas";
import { vote } from "@/lib/server/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const id = await readIdParam(params);
    const { voter } = await readJsonBody(request, voteBodySchema);
    const body: VoteResponse = vote(id, voter);
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "POST /api/requests/[id]/votes");
  }
}
