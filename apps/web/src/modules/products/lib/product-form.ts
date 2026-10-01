import type { DomainEntitiesProductsCreateProductRequest } from "@/shared/api/generated/products";
import type { ProductFormSource, ProductFormValues } from "../schemas/product-form-schema";

export const divisionOptions = [{ value: "0", label: "Beta-lactam" }, { value: "1", label: "Non-beta-lactam" }] as const;

/** "Millilitre (ml)", as the unit pickers label a unit. */
export function unitLabel(unit: { name?: string | null | undefined; symbol?: string | null | undefined }): string {
  const name = unit.name?.trim() ?? "";
  const symbol = unit.symbol?.trim() ?? "";
  return name && symbol ? `${name} (${symbol})` : name || symbol || "Unnamed unit";
}

const blankToNull = (value: string | undefined) => value?.trim() || null;

/** The request body for creating or updating a product. Quantities are in the product's base unit, as entered. */
export function toProductRequest(values: ProductFormValues): DomainEntitiesProductsCreateProductRequest {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    genericName: blankToNull(values.genericName),
    description: values.description?.trim() ? values.description : null,
    filledWeight: blankToNull(values.filledWeight),
    storageCondition: blankToNull(values.storageCondition),
    shelfLife: blankToNull(values.shelfLife),
    actionUse: blankToNull(values.actionUse),
    fdaRegistrationNumber: blankToNull(values.fdaRegistrationNumber),
    masterFormulaNumber: blankToNull(values.masterFormulaNumber),
    documentNumber: blankToNull(values.documentNumber),
    ...(values.revisionNumber === null || values.revisionNumber === undefined ? {} : { revisionNumber: values.revisionNumber }),
    categoryId: values.category.value,
    departmentId: values.department.value,
    baseUomId: values.baseUom.value,
    equipmentId: values.equipment?.value || null,
    division: values.division.value === "0" ? 0 : 1,
    baseQuantity: values.baseQuantity,
    fullBatchSize: values.fullBatchSize,
    price: values.price,
  };
}

/** Starting values of the edit form. Returns null for a field the product does not have, so the form shows it empty. */
export function toFormValues(product: ProductFormSource): Partial<ProductFormValues> {
  const division = divisionOptions.find((item) => item.value === String(product.division));
  const positive = (value: number | null | undefined) => typeof value === "number" && value > 0 ? value : undefined;
  const values: Partial<ProductFormValues> = {
    name: product.name, code: product.code, genericName: product.genericName, description: product.description,
    filledWeight: product.filledWeight, storageCondition: product.storageCondition, shelfLife: product.shelfLife,
    actionUse: product.actionUse, fdaRegistrationNumber: product.fdaRegistrationNumber,
    masterFormulaNumber: product.masterFormulaNumber, documentNumber: product.documentNumber,
    revisionNumber: product.revisionNumber ?? null, equipment: product.equipment,
  };
  const baseQuantity = positive(product.baseQuantity);
  const fullBatchSize = positive(product.fullBatchSize);
  const price = positive(product.price);
  if (baseQuantity !== undefined) values.baseQuantity = baseQuantity;
  if (fullBatchSize !== undefined) values.fullBatchSize = fullBatchSize;
  if (price !== undefined) values.price = price;
  if (product.category) values.category = product.category;
  if (product.department) values.department = product.department;
  if (division) values.division = { ...division };
  if (product.baseUoM?.id) values.baseUom = { value: product.baseUoM.id, label: unitLabel(product.baseUoM) };
  return values;
}
