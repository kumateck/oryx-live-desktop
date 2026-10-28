import { useCallback } from "react";
import { formsApi } from "@/shared/api/generated/forms";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

const audit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;

/**
 * Templates a specification can use. Not filtered by template type: Oryx Next saved every template as analytical raw data,
 * so filtering to specification templates would hide the templates specifications already use.
 */
export function useTemplateLoader(): SelectLoader {
  const [load] = formsApi.useLazyGetApiV1FormQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const result = await request.unwrap();
    const current = result.pageIndex ?? page;
    return { options: (result.data ?? []).flatMap((form) => form.id ? [{ value: form.id, label: form.name?.trim() || "Unnamed template" }] : []), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
  }, [load]);
}
