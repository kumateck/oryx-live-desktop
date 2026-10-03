import { useEffect, useMemo } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { auditFor } from "../lib/customers";

const { usePostApiV1CollectionMutation } = settingsApi;
const named = (items: readonly { id?: string | null; name?: string | null; symbol?: string | null }[] | undefined): SelectOption[] =>
  (items ?? []).flatMap((item) => item.id && (item.name || item.symbol) ? [{ value: item.id, label: [item.name?.trim(), item.symbol?.trim() ? `(${item.symbol.trim()})` : ""].filter(Boolean).join(" ") }] : []);

/** The currencies and payment terms a customer's commercial terms choose from. */
export function useCustomerCollections() {
  const [load, state] = usePostApiV1CollectionMutation();
  useEffect(() => { void load({ ...auditFor("Customer profile"), body: ["Currency", "TermsOfPayment"] }); }, [load]);
  return useMemo(() => ({ currencies: named(state.data?.Currency), terms: named(state.data?.TermsOfPayment), loading: state.isLoading || state.isUninitialized }), [state.data, state.isLoading, state.isUninitialized]);
}
