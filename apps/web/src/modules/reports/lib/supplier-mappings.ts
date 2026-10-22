import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";
import type { SupplierMapping } from "../api/contract-adapters";
export function supplierMappingSheets(mappings: readonly SupplierMapping[], summary: boolean) {
  const rows = mappings.flatMap((mapping) => (mapping.materials ?? []).map((entry) => ({ mapping, entry })));
  const detail = reportSheet("Supplier and manufacturer mappings", rows, [
    { label: "Material", read: ({ entry }) => entry.material?.name }, { label: "Material code", read: ({ entry }) => entry.material?.code },
    { label: "Material type", read: ({ entry }) => reportEnum(entry.material?.kind, ["Raw material", "Packaging material"]) },
    { label: "Manufacturer", read: ({ mapping }) => mapping.manufacturers?.name }, { label: "Manufacturer address", read: ({ mapping }) => mapping.manufacturers?.address },
    { label: "Supplier", read: ({ mapping }) => mapping.supplier?.name }, { label: "Supplier address", read: ({ mapping }) => mapping.supplier?.address },
    { label: "Quantity per pack", read: ({ entry }) => { const pack = entry.quantityPerPackOption; return pack?.min != null && pack.max != null ? `${pack.min} to ${pack.max}` : pack?.min ?? pack?.max ?? pack?.values?.join(", ") ?? null; } },
    { label: "Unit", read: ({ mapping }) => mapping.uom?.symbol ?? mapping.uom?.name },
    { label: "Date of approval", read: ({ mapping }) => reportDate(mapping.manufacturers?.approvedAt) }, { label: "Validity date", read: ({ mapping }) => reportDate(mapping.manufacturers?.validityDate) },
  ]);
  if (!summary) return { sheets: [detail] };
  const groups = new Map<string, { name: string | null; kind: number | null; manufacturers: Set<string>; suppliers: Set<string>; missingManufacturer: boolean; missingSupplier: boolean }>();
  for (const { mapping, entry } of rows) {
    const material = entry.material;
    if (!material?.id) throw new Error("A material mapping has no identity; unique supplier/manufacturer counts cannot be verified.");
    const group = groups.get(material.id) ?? { name: material.name ?? null, kind: material.kind ?? null, manufacturers: new Set<string>(), suppliers: new Set<string>(), missingManufacturer: false, missingSupplier: false };
    if (mapping.manufacturers?.id) group.manufacturers.add(mapping.manufacturers.id); else group.missingManufacturer = true;
    if (mapping.supplier?.id) group.suppliers.add(mapping.supplier.id); else group.missingSupplier = true;
    groups.set(material.id, group);
  }
  const totals = reportSheet("Unique counterpart counts", [...groups.values()], [
    { label: "Material", read: (row) => row.name }, { label: "Material type", read: (row) => reportEnum(row.kind, ["Raw material", "Packaging material"]) },
    { label: "Manufacturer count", read: (row) => row.missingManufacturer ? null : row.manufacturers.size }, { label: "Supplier count", read: (row) => row.missingSupplier ? null : row.suppliers.size },
  ]);
  const warnings = [...groups.values()].some((row) => row.missingManufacturer || row.missingSupplier) ? ["Some counterpart identities were not returned. Their unique counts are unavailable; mapping details are retained."] : [];
  return { sheets: [totals, detail], warnings };
}
