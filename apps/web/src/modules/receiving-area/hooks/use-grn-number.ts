import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { settingsApi } from "@/shared/api/generated/settings";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { audit, grnNumber, grnPrefix } from "../lib/receiving";
import type { GrnFormValues } from "../schemas/receiving-schema";

const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;

/** GRN uses its warehouse/material/year series, rather than a configurable naming rule. */
export function useGrnNumber(form: UseFormReturn<GrnFormValues>, kind: MaterialKind, beta: boolean) {
  const [countUsed] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [busy, setBusy] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const sequence = useRef(0);

  const generate = useCallback(async (): Promise<string | null> => {
    const request = ++sequence.current;
    setBusy(true);
    setUnavailable(false);
    const prefix = grnPrefix(kind, beta, new Date().getFullYear());
    const used = await countUsed({ ...audit, modelType: "GrnNumber", prefix }, false).unwrap().catch(() => null);
    if (request !== sequence.current) return null;
    setBusy(false);
    if (used === null || !Number.isSafeInteger(used) || used < 0 || !Number.isSafeInteger(used + 1)) {
      setUnavailable(true);
      return null;
    }
    const next = grnNumber(prefix, used);
    form.setValue("number", next, { shouldValidate: true });
    return next;
  }, [countUsed, form, kind, beta]);

  useEffect(() => {
    void generate();
    return () => { sequence.current++; };
  }, [generate]);

  return { generate, busy, unavailable };
}
