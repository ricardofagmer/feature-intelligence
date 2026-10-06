import type { AiCallLogger } from "@/lib/ai/schema";
import { insertAiCall } from "@/lib/server/repo-workflow";

/** Persists every AI call into ai_calls: the observability trail and the seed of a future golden set. */
export const persistAiCall: AiCallLogger = (log) => {
  insertAiCall(log);
};
