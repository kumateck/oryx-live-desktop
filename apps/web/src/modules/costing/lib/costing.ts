import { formatMoney } from "@/shared/procurement/price";

/** Finance → Costing on the role permissions page. The backend guards every costing and pricing-agreement endpoint with it. */
export const costingPermissions = { manage: "ManageCosting" } as const;
export const costingAudit = { module: "Finance", subModule: "Costing" } as const;
export const costingPath = "/finance/costing";
export const agreementsPath = `${costingPath}/agreements`;
export const agreementPath = (id: string) => `${agreementsPath}/${encodeURIComponent(id)}`;
export const customerPath = (id: string) => `/crm/customers/${encodeURIComponent(id)}`;

export interface CurrencyLike { id?: string | null; name?: string | null; symbol?: string | null }

/** A price shown with the currency it is in. Prices are never converted; one without a currency says so. */
export function priceIn(amount: number | null | undefined, currency: CurrencyLike | null | undefined): string {
  const symbol = currency?.symbol?.trim() || currency?.name?.trim();
  return symbol ? formatMoney(amount, symbol) : `${formatMoney(amount)} · no currency`;
}

export function currencyName(currency: CurrencyLike | null | undefined): string {
  const name = currency?.name?.trim(); const symbol = currency?.symbol?.trim();
  return name && symbol && name !== symbol ? `${name} (${symbol})` : name || symbol || "Not set";
}

export type AgreementState = "upcoming" | "active" | "ended";
export const agreementStateLabels: Record<AgreementState, string> = { upcoming: "Starts later", active: "In effect", ended: "Ended" };

/** Whether an agreement applies on a day. The end day is included, as the server treats it. */
export function agreementState(from: string | null | undefined, to: string | null | undefined, now = new Date()): AgreementState {
  if (from && new Date(from) > now) return "upcoming";
  if (to && new Date(to) < now) return "ended";
  return "active";
}
