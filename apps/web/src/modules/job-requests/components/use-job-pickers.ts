import { useCallback, useEffect, useMemo } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { productsApi } from "@/shared/api/generated/products";
import { servicesApi } from "@/shared/api/generated/services";
import { settingsApi } from "@/shared/api/generated/settings";
import type { SelectLoader, SelectOption } from "@/shared/forms/form-wizard-types";
import { jobAudit } from "../lib/job-requests";

interface Page { data?: readonly unknown[] | null; pageIndex?: number; pageCount?: number }
const paged = (data: Page | undefined, map: (row: Record<string, unknown>) => SelectOption | null) => ({
  options: (data?.data ?? []).flatMap((row) => { const option = map(row as Record<string, unknown>); return option ? [option] : []; }),
  hasNext: (data?.pageIndex ?? 1) < (data?.pageCount ?? 1), hasPrevious: (data?.pageIndex ?? 1) > 1,
});
const str = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : null;

/** Choices for job request and job order forms: sites, equipment, services, employees and service providers. */
export function useJobPickers() {
  const [loadCollections, collections] = settingsApi.usePostApiV1CollectionMutation();
  useEffect(() => { void loadCollections({ ...jobAudit, body: ["Site"] }); }, [loadCollections]);
  const equipment = productsApi.useGetApiV1ProductEquipmentAllQuery(jobAudit);
  const [loadServices] = servicesApi.useLazyGetApiV1ServicesQuery();
  const [loadEmployees] = hrApi.useLazyGetApiV1EmployeeQuery();
  const [loadProviders] = servicesApi.useLazyGetApiV1ServiceProvidersQuery();
  const sites = useMemo(() => (collections.data?.Site ?? []).flatMap((s) => s.id ? [{ value: s.id, label: s.name ?? "Unnamed site" }] : []), [collections.data]);
  const equipmentOptions = useMemo(() => (equipment.data ?? []).flatMap((e) => e.id ? [{ value: e.id, label: e.name ?? "Unnamed equipment" }] : []), [equipment.data]);
  const services = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadServices({ ...jobAudit, searchQuery, page, pageSize: 20, isActive: true }, true);
    if (result.error) throw new Error("Services could not be loaded.");
    return paged(result.data, (r) => str(r.id) ? { value: String(r.id), label: str(r.name) ?? "Unnamed service" } : null);
  }, [loadServices]);
  const employees = useCallback<SelectLoader>(async (searchQuery, page) => {
    const result = await loadEmployees({ ...jobAudit, searchQuery, page, pageSize: 20, status: 0 }, true);
    if (result.error) throw new Error("Employees could not be loaded.");
    return paged(result.data, (r) => str(r.id) ? { value: String(r.id), label: [str(r.firstName), str(r.lastName)].filter(Boolean).join(" ") || str(r.email) || "Unnamed employee" } : null);
  }, [loadEmployees]);
  const providers = useCallback((serviceId: string | null): SelectLoader => async (searchQuery, page) => {
    const result = await loadProviders({ ...jobAudit, searchQuery, page, pageSize: 20, ...(serviceId ? { serviceId } : {}) }, true);
    if (result.error) throw new Error("Service providers could not be loaded.");
    return paged(result.data, (r) => str(r.id) ? { value: String(r.id), label: str(r.name) ?? "Unnamed provider" } : null);
  }, [loadProviders]);
  return { sites, equipment: equipmentOptions, services, employees, providers };
}
