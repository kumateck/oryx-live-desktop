import { useCallback, useState } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import { generateCode } from "./generate-code";

const { useGetApiV1ConfigurationByModelTypeByModelTypeQuery, useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;
const audit = { module: "Settings", subModule: "Code Settings" } as const;

/**
 * Suggests the next code for a record type from its configured rule. The suggestion is a
 * convenience: two people creating at once can receive the same one, and the backend decides
 * whether a code is accepted.
 */
export function useGeneratedCode(modelType: string) {
  const config = useGetApiV1ConfigurationByModelTypeByModelTypeQuery({ ...audit, modelType });
  const [loadCount] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const rule = config.data;

  const suggest = useCallback(async (): Promise<string | null> => {
    if (!rule || rule.namingType === undefined) return null;
    setBusy(true); setFailed(false);
    try {
      const prefix = rule.prefix ?? "";
      const count = await loadCount({ ...audit, modelType, prefix }).unwrap().catch(() => null);
      if (count === null || !Number.isSafeInteger(count) || count < 0 || (rule.namingType === 0 && rule.maximumNameLength && String(count + 1).length > rule.maximumNameLength)) { setFailed(true); return null; }
      return generateCode({ prefix, namingType: rule.namingType, minimumLength: rule.minimumNameLength ?? 0, maximumLength: rule.maximumNameLength ?? 0 }, count) || null;
    } finally {
      setBusy(false);
    }
  }, [rule, loadCount, modelType]);

  return { suggest, ready: Boolean(rule), busy: busy || config.isLoading, unavailable: failed || Boolean(config.error) };
}
