/**
 * One backend permission per task and section, per context (permissions audit phase 2). Production authors products and
 * QA maintains them; nothing in one context grants anything in the other. The server enforces the same keys
 * (`ProductPermissions` in oryx-backend), and a bulk section save needs the key for each kind of change it makes.
 */
export type ProductMode = "production" | "qa";
export type ProductSection = "info" | "bom" | "packaging" | "packingStyle" | "packingOrder" | "procedure";
export interface SectionKeys { view: string; edit: string; add?: string; delete?: string; archive?: string }

interface ModeKeys {
  list: string;
  create?: string;
  deleteProduct?: string;
  print?: string;
  specifications: string;
  ards: string;
  stps?: string;
  sections: Record<ProductSection, SectionKeys>;
}

export const productKeys: Record<ProductMode, ModeKeys> = {
  production: {
    list: "CanViewProductionProducts",
    create: "CanCreateProductionProduct",
    deleteProduct: "CanDeleteProductionProduct",
    print: "CanPrintProductionProduct",
    specifications: "CanViewProductionProductSpecifications",
    stps: "CanViewProductionProductStps",
    ards: "CanViewProductionProductArds",
    sections: {
      info: { view: "CanViewProductionProductInfo", edit: "CanEditProductionProductInfo" },
      bom: { view: "CanViewProductionProductBom", add: "CanAddProductionProductBom", edit: "CanEditProductionProductBom",
        delete: "CanDeleteProductionProductBom", archive: "CanArchiveProductionProductBom" },
      packaging: { view: "CanViewProductionProductPackingMaterials", add: "CanAddProductionProductPackingMaterials",
        edit: "CanEditProductionProductPackingMaterials", delete: "CanDeleteProductionProductPackingMaterials" },
      packingStyle: { view: "CanViewProductionProductPackingStyles", add: "CanAddProductionProductPackingStyles",
        edit: "CanEditProductionProductPackingStyles", delete: "CanDeleteProductionProductPackingStyles" },
      packingOrder: { view: "CanViewProductionProductPackingOrder", edit: "CanEditProductionProductPackingOrder" },
      procedure: { view: "CanViewProductionProductProcedure", add: "CanAddProductionProductProcedure",
        edit: "CanEditProductionProductProcedure", delete: "CanDeleteProductionProductProcedure" },
    },
  },
  qa: {
    list: "CanViewQaProducts",
    specifications: "CanViewQaProductSpecifications",
    stps: "CanViewQaProductStps",
    ards: "CanViewQaProductArds",
    sections: {
      info: { view: "CanViewQaProductInfo", edit: "CanEditQaProductInfo" },
      bom: { view: "CanViewQaProductBom", add: "CanAddQaProductBom", edit: "CanEditQaProductBom", delete: "CanDeleteQaProductBom",
        archive: "CanArchiveQaProductBom" },
      packaging: { view: "CanViewQaProductPackingMaterials", add: "CanAddQaProductPackingMaterials", edit: "CanEditQaProductPackingMaterials",
        delete: "CanDeleteQaProductPackingMaterials" },
      packingStyle: { view: "CanViewQaProductPackingStyles", add: "CanAddQaProductPackingStyles", edit: "CanEditQaProductPackingStyles",
        delete: "CanDeleteQaProductPackingStyles" },
      packingOrder: { view: "CanViewQaProductPackingOrder", edit: "CanEditQaProductPackingOrder" },
      procedure: { view: "CanViewQaProductProcedure", add: "CanAddQaProductProcedure", edit: "CanEditQaProductProcedure",
        delete: "CanDeleteQaProductProcedure" },
    },
  },
};

/** The keys that change a section: any one of them opens its editor; each action and the server check its own. */
export function changeKeys(keys: SectionKeys): string[] {
  return [keys.add, keys.edit, keys.delete, keys.archive].filter((key): key is string => Boolean(key));
}

/** Every key that changes any section in a context: the product edit pages open with any one of them. */
export function anyChangeKeys(mode: ProductMode): string[] {
  return Object.values(productKeys[mode].sections).flatMap(changeKeys);
}

/** The server reads the context from the request; Production is the default. */
export function contextArg(mode: ProductMode): { context?: string } {
  return mode === "qa" ? { context: "qa" } : {};
}
