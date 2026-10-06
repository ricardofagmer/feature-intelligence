import type { ReviewItem } from "@/lib/types";
import { handleRouteError, jsonOk, readIdParam, readJsonBody } from "@/lib/server/http";
import { reviewActionBodySchema } from "@/lib/server/schemas";
import { applyReviewAction } from "@/lib/server/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const id = await readIdParam(params);
    const { action } = await readJsonBody(request, reviewActionBodySchema);
    const body: { item: ReviewItem } = { item: applyReviewAction(id, action) };
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "POST /api/review/[id]");
  }
}
