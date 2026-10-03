import { useEffect } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { audit } from "../lib/proforma-response-access";

const collections = ["TermsOfPayment", "DeliveryMode"];
const toOptions = (items: readonly { id?: string | null; name?: string | null }[] | undefined): SelectOption[] =>
  (items ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []);

/** The payment terms and delivery modes an order can be given, read in one request. */
export function useOrderTerms() {
  const [load, state] = settingsApi.usePostApiV1CollectionMutation();
  useEffect(() => { void load({ ...audit, body: collections }); }, [load]);
  return { termsOfPayment: toOptions(state.data?.TermsOfPayment), deliveryModes: toOptions(state.data?.DeliveryMode), loading: state.isLoading,
    error: state.error ? apiErrorMessage(state.error) : null, retry: () => { void load({ ...audit, body: collections }); } };
}
