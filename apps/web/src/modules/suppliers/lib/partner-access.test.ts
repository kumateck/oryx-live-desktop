import { expect, it } from "vitest";
import { manifest as suppliers } from "../manifest";
import { manifest as manufacturers } from "../../manufacturers/manifest";
import { manifest as compliance } from "../../supplier-compliance/manifest";
import { canAccess, routeAccessRule } from "../../registry-model";
import { navigationCatalog } from "../../navigation/catalog.generated";
import { visibleNavigation } from "../../navigation/navigation-model";

const modules = [suppliers, manufacturers, compliance];
const allowed = (path: string, permissions: string[]) => {
  const rule = routeAccessRule(modules, path);
  return rule ? canAccess(rule, { state: "authenticated", permissions: new Set(permissions) }) : false;
};

it("separates supplier and manufacturer actions by exact permission", () => {
  expect(allowed("/settings/suppliers", ["CanViewVendors"])).toBe(true);
  expect(allowed("/settings/suppliers/create", ["CanViewVendors"])).toBe(false);
  expect(allowed("/settings/suppliers/create", ["CanCreateVendor"])).toBe(true);
  expect(allowed("/settings/suppliers/s1/edit", ["CanUpdateVendorDetails"])).toBe(true);
  expect(allowed("/settings/manufacturers", ["CanViewVendors"])).toBe(false);
  expect(allowed("/settings/manufacturers/m1/edit", ["CanUpdateManufacturerDetails"])).toBe(true);
});

it("opens relationship sections by SRM permission and compliance only for certificate viewers", () => {
  expect(allowed("/settings/suppliers/s1/relationship", ["CanViewSupplierSpend"])).toBe(true);
  expect(allowed("/settings/suppliers/s1/relationship", ["CanManageSupplierContracts"])).toBe(true);
  expect(allowed("/settings/suppliers/s1/relationship", ["CanViewVendors"])).toBe(false);
  expect(allowed("/procurement/supplier-compliance", ["CanViewSupplierSpend"])).toBe(false);
  expect(allowed("/procurement/supplier-compliance", ["CanViewSupplierCertifications"])).toBe(true);
  const spendOnly = visibleNavigation(navigationCatalog, { state: "authenticated", permissions: new Set(["CanViewSupplierSpend"]) });
  expect(spendOnly.flatMap((group) => group.items).some((item) => item.path === "/procurement/supplier-compliance")).toBe(false);
});
