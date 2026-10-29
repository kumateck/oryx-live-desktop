import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const num = z.number().nullish().transform((value) => value !== null && value !== undefined && Number.isFinite(value) ? value : null);
const flag = z.boolean().nullish().transform((value) => value ?? false);
const named = z.object({ name: text }).nullish().transform((value) => value?.name ?? null);
const uom = z.object({ name: text, symbol: text }).nullish().transform((value) => value ?? null);
const symbol = z.object({ symbol: text }).nullish().transform((value) => value?.symbol ?? null);
const item = z.object({ id: text, name: text, code: text }).nullish().transform((value) => value ?? null);
const list = <T extends z.ZodType>(schema: T) => z.array(schema).nullish().transform((value) => value ?? []);
const person = z.object({ firstName: text, lastName: text }).nullish()
  .transform((value) => value ? `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || null : null);

// The bill of materials carries each material's category (its function in the product) and specification number.
const bomMaterial = z.object({
  id: text, name: text, code: text,
  materialCategory: z.object({ name: text }).nullish().transform((value) => value?.name ?? null),
  specification: z.object({ specificationNumber: text }).nullish().transform((value) => value?.specificationNumber ?? null),
}).nullish().transform((value) => value ? { id: value.id, name: value.name, code: value.code, category: value.materialCategory, specificationNumber: value.specification } : null);
const bomItem = z.object({
  id: text, order: num, material: bomMaterial, baseQuantity: num, baseUoM: symbol, grade: text, casNumber: text,
});
const bom = z.object({
  version: num, effectiveDate: text, isActive: flag,
  billOfMaterial: z.object({ items: list(bomItem) }).nullish().transform((value) => value?.items ?? []),
}).transform((value) => ({ version: value.version, effectiveDate: value.effectiveDate, isActive: value.isActive, items: value.billOfMaterial }));

const packing = z.object({
  id: text, name: text, description: text, packPerShipper: num, basePackingUoM: uom, basePackingQuantity: num, expectedYield: num,
  isDefault: flag, packingLists: list(z.object({ uom, quantity: num, order: num })),
});
const productPackage = z.object({
  id: text, material: item, directLinkMaterial: item, baseQuantity: num, unitCapacity: num, packingExcessMargin: num,
  prescribedQuantity: num, productPacking: z.object({ name: text }).nullish().transform((value) => value?.name ?? null),
});

export const productDetailSchema = z.object({
  id: z.uuid(), code: text, name: text, description: text, labelClaim: text, genericName: text, storageCondition: text,
  filledWeight: text, shelfLife: text, actionUse: text, fdaRegistrationNumber: text, masterFormulaNumber: text,
  primaryPackDescription: text, secondaryPackDescription: text, tertiaryPackDescription: text, documentNumber: text,
  revisionNumber: num, category: named, department: named, division: num, baseQuantity: num, fullBatchSize: num,
  baseUoM: z.object({ name: text, symbol: text, description: text }).nullish().transform((value) => value ?? null),
  equipment: z.object({ name: text, equipmentNumber: text, capacityQuantity: num, uoM: symbol, location: text }).nullish().transform((value) => value ?? null),
  price: num, priceUoM: text, isVerified: flag, createdAt: text, createdBy: named,
  currentBillOfMaterial: bom.nullish().transform((value) => value ?? null),
  outdatedBillOfMaterials: list(bom), packages: list(productPackage), packings: list(packing),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type BomItem = z.infer<typeof bomItem>;
export type ProductBom = z.infer<typeof bom>;
export type ProductPacking = z.infer<typeof packing>;
export type ProductPackage = z.infer<typeof productPackage>;

const responsible = (kind: "user" | "role") => z.object({
  user: named.optional(), role: named.optional(), action: num,
  productAnalyticalRawData: z.object({ productStandardTestProcedure: z.object({ stpNumber: text }).nullish() }).nullish(),
}).transform((value) => ({
  kind, name: (kind === "user" ? value.user : value.role) ?? null, action: value.action,
  stpNumber: value.productAnalyticalRawData?.productStandardTestProcedure?.stpNumber ?? null,
}));
export const routeListSchema = z.array(z.object({
  id: z.uuid(), order: num, operation: named, estimatedTime: text, isCritical: flag,
  workCenters: list(z.object({ workCenter: named }).transform((value) => value.workCenter)),
  resources: list(z.object({ resource: named }).transform((value) => value.resource)),
  responsibleUsers: list(responsible("user")), responsibleRoles: list(responsible("role")),
}).transform((route) => ({
  id: route.id, order: route.order, operation: route.operation, estimatedTime: route.estimatedTime, isCritical: route.isCritical,
  workCenters: route.workCenters.flatMap((name) => name ? [name] : []),
  resources: route.resources.flatMap((name) => name ? [name] : []),
  personnel: [...route.responsibleUsers, ...route.responsibleRoles],
}))).transform((routes) => [...routes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
export type ProductRoute = z.infer<typeof routeListSchema>[number];

export const stpSchema = z.object({ id: z.uuid(), stpNumber: text, createdBy: person, createdAt: text });
// The endpoint returns the product's one STP, or nothing; the table takes a list.
export const stpListSchema = z.preprocess((value) => Array.isArray(value) ? value : value ? [value] : [], z.array(stpSchema));
export type ProductStp = z.infer<typeof stpSchema>;

export const specificationListSchema = z.array(z.object({
  id: z.uuid(), testStage: num, specificationNumber: text, effectiveDate: text, reviewDate: text, revisionNumber: text, supersedesNumber: text,
}));
export type ProductSpecification = z.infer<typeof specificationListSchema>[number];

export const ardListSchema = z.array(z.object({
  id: z.uuid(), specNumber: text, stage: num, createdAt: text,
  stpNumber: text.optional(), form: named,
  productStandardTestProcedure: z.object({ stpNumber: text }).nullish().transform((value) => value?.stpNumber ?? null),
}).transform((ard) => ({ id: ard.id, specNumber: ard.specNumber, stage: ard.stage, createdAt: ard.createdAt, form: ard.form,
  stpNumber: ard.stpNumber ?? ard.productStandardTestProcedure })));
export type ProductArd = z.infer<typeof ardListSchema>[number];
