import { useEffect } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { apiErrorMessage } from "@/shared/errors/api-error-message";

const { usePostApiV1CollectionMutation } = settingsApi;
const audit = { module: "General", subModule: "Collection" } as const;
const allCollections = ["Country", "Currency"];
const currencyCollection = ["Currency"];
const supplierCollections = ["Country", "Currency"];
const toOptions = (items: readonly { id?: string | null; name?: string | null }[] | undefined): SelectOption[] =>
  (items ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []);
/** One reference-data request for country and currency. Never loads the full ERP collections. */
export function usePartnerCollections(scope: "all" | "currency" | "supplier" = "all") {
  const [load, state] = usePostApiV1CollectionMutation();
  const body = scope === "currency" ? currencyCollection : scope === "supplier" ? supplierCollections : allCollections;
  useEffect(() => { void load({ ...audit, body }); }, [load, body]);
  return {
    countries: toOptions(state.data?.Country), currencies: toOptions(state.data?.Currency),
    loading: state.isLoading, error: state.error ? apiErrorMessage(state.error) : null,
    retry: () => { void load({ ...audit, body }); },
  };
}
