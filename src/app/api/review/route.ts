import type { ReviewListResponse } from "@/lib/types";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { listReviewItems } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const body: ReviewListResponse = { items: listReviewItems() };
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "GET /api/review");
  }
}
