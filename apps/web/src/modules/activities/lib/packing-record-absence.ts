import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";
import { z } from "zod";

const legacyAbsentRecord = z.object({ errors: z.array(z.object({ code: z.literal("Error.NullValue") })).length(1) });

/** Older backends report an absent final-packing record as this specific 400 validation error. */
export function absentFinalPacking(error: FetchBaseQueryError | SerializedError | undefined): boolean {
  return Boolean(error && "status" in error && (error.status === 404
    || (error.status === 400 && legacyAbsentRecord.safeParse(error.data).success)));
}
