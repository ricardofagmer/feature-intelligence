import type { ListThemesResponse } from "@/lib/types";
import { handleRouteError, jsonOk } from "@/lib/server/http";
import { listThemes } from "@/lib/server/services";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const body: ListThemesResponse = { themes: listThemes() };
    return jsonOk(body);
  } catch (error) {
    return handleRouteError(error, "GET /api/themes");
  }
}
