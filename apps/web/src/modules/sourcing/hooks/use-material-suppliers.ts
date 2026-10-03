import { useMemo } from "react";
import { z } from "zod";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProcurementSupplierByMaterialIdAndTypeQuery } from "../api/sourcing-api";
import { audit } from "../lib/sourcing-access";

const suppliersSchema = z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((supplier) => supplier.id ? [{ value: supplier.id, label: supplier.name?.trim() || "Unnamed supplier" }] : []));
const none: { value: string; label: string }[] = [];

/** The suppliers of one type that are set up to supply a material. Each line loads its own, and the answer is cached per material and type. */
export function useMaterialSuppliers(materialId: string | null, type: SupplierType | null) {
  const query = useGetApiV1ProcurementSupplierByMaterialIdAndTypeQuery({ ...audit, materialId: materialId ?? "", type: type ?? 0 }, { skip: !materialId || type === null });
  const options = useMemo(() => { const parsed = suppliersSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : none; }, [query.data]);
  return { options, loading: query.isFetching, error: query.error ? apiErrorMessage(query.error) : null };
}
