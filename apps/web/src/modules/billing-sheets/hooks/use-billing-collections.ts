import { useCallback, useEffect, useMemo } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { audit } from "../lib/billing-access";

const { usePostApiV1CollectionMutation } = settingsApi;
const kinds = { all: ["Charge", "Currency", "PackageStyle"], charges: ["Charge", "Currency"], styles: ["PackageStyle"] } as const;
const named = (items: readonly { id?: string | null; name?: string | null }[] | undefined): SelectOption[] => (items ?? []).flatMap((item) => item.id && item.name?.trim() ? [{ value: item.id, label: item.name.trim() }] : []);

/** The charges, currencies and packaging styles a billing sheet chooses from, in one request. */
export function useBillingCollections(scope: keyof typeof kinds = "all") {
  const [load, state] = usePostApiV1CollectionMutation();
  const run = useCallback(() => { void load({ ...audit, body: [...kinds[scope]] }); }, [load, scope]);
  useEffect(run, [run]);
  return useMemo(() => ({
    charges: named(state.data?.Charge), packageStyles: named(state.data?.PackageStyle),
    currencies: (state.data?.Currency ?? []).flatMap((item): SelectOption[] => item.id && (item.name || item.symbol) ? [{ value: item.id, label: [item.name?.trim(), item.symbol?.trim() ? `(${item.symbol.trim()})` : ""].filter(Boolean).join(" ") }] : []),
    loading: state.isLoading || state.isUninitialized, error: state.error ? apiErrorMessage(state.error) : null, retry: run,
  }), [state.data, state.isLoading, state.isUninitialized, state.error, run]);
}
