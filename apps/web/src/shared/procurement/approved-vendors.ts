import { useMemo } from "react";
import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { useAccess } from "@/shared/auth/use-access";
import type { CellOption } from "@/shared/datatable/lib/options";

/**
 * What QA's current approved vendor list allows, for procurement screens to hide or disable choices. The server
 * refuses the same choices on save; this only spares people a refused save. A material not on the list is
 * unrestricted.
 */
export const approvedVendorEligibilityKey = "CanViewApprovedVendorEligibility";

const eligibilitySchema = z.array(z.object({
  materialId: z.string(), restricted: z.boolean().catch(false),
  approved: z.array(z.object({ manufacturerId: z.string(), supplierId: z.string() })).nullish().transform((pairs) => pairs ?? []),
}));
export type VendorEligibility = z.infer<typeof eligibilitySchema>[number];

const eligibilityApi = api.injectEndpoints({ endpoints: (build) => ({
  approvedVendorEligibility: build.query<VendorEligibility[], readonly string[]>({
    query: (materialIds) => ({ url: "/api/v1/approved-vendor-list/eligibility", method: "POST", body: { materialIds },
      headers: { Module: "Procurement", SubModule: "Approved Vendor List" } }),
    transformResponse: (data: z.input<typeof eligibilitySchema>) => eligibilitySchema.parse(data),
    providesTags: [{ type: "approved-vendor-list", id: "LIST" }],
  }),
}) });

/** The eligibility of the materials, by material id. Empty when the caller cannot read it or nothing is asked. */
export function useApprovedVendors(materialIds: readonly string[]) {
  const { has } = useAccess();
  const ids = useMemo(() => [...new Set(materialIds.filter(Boolean))].sort(), [materialIds]);
  const query = eligibilityApi.useApprovedVendorEligibilityQuery(ids, { skip: ids.length === 0 || !has(approvedVendorEligibilityKey) });
  return useMemo(() => new Map((query.data ?? []).map((row) => [row.materialId, row])), [query.data]);
}

/** Why a supplier cannot be used for the material, or null when it can. */
export function supplierRefusal(eligibility: VendorEligibility | undefined, supplierId: string): string | null {
  if (!eligibility?.restricted) return null;
  return eligibility.approved.some((pair) => pair.supplierId === supplierId) ? null : "Not on the approved vendor list for this material, or its approval has lapsed";
}

/** Why a manufacturer cannot be used for the material (through the supplier, when known), or null when it can. */
export function manufacturerRefusal(eligibility: VendorEligibility | undefined, manufacturerId: string, supplierId: string | null): string | null {
  if (!eligibility?.restricted) return null;
  return eligibility.approved.some((pair) => pair.manufacturerId === manufacturerId && (supplierId === null || pair.supplierId === supplierId))
    ? null : "Not on the approved vendor list for this material, or its approval has lapsed";
}

/** Disables the options the list does not allow, keeping any already chosen visible so it can be removed. */
export function markOptions(options: readonly CellOption[], refusal: (value: string) => string | null): CellOption[] {
  return options.map((option) => {
    const reason = refusal(option.value);
    return reason ? { ...option, label: `${option.label} (not approved)`, disabled: true } : option;
  });
}
