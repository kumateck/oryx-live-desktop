import assert from "node:assert/strict";
import test from "node:test";
import { navigationCatalog } from "../apps/web/src/modules/navigation/catalog.generated.ts";
import { collectionViewPermissions } from "../apps/web/src/modules/collection-configurations/lib/collections.ts";
import {
  activeNavigation, navigationPages, navigationTrail, visibleNavigation, type NavigationGroup,
} from "../apps/web/src/modules/navigation/navigation-model.ts";

const groups: readonly NavigationGroup[] = [
  { id: "main", label: "Main", items: [
    { id: "main.dashboard", label: "Dashboard", path: "/home", children: [
      { id: "main.dashboard.overview", label: "Overview", path: "/home" },
      { id: "main.dashboard.hr", label: "HR Dashboard", path: "/hr-dashboard", permissions: ["hr.view", "hr.extra"] },
    ] },
  ] },
  { id: "qc", label: "Quality Control", items: [
    { id: "qc.testing", label: "Testing", children: [
      { id: "qc.testing.raw", label: "Raw", path: "/qc/tests?type=0", permissions: ["qc.raw"] },
      { id: "qc.testing.pack", label: "Packaging", path: "/qc/tests?type=1", permissions: ["qc.pack"] },
    ] },
    { id: "qc.specs", label: "Specifications", path: "/qc/specifications", permissions: ["qc.specs"] },
  ] },
];
const user = (...keys: string[]) => ({ state: "authenticated", permissions: new Set(keys) }) as const;

test("shows nothing to an anonymous visitor", () => {
  assert.deepEqual(visibleNavigation(groups, { state: "anonymous" }), []);
});

test("hides entries without a held permission and drops empty headings and groups", () => {
  const plain = visibleNavigation(groups, user());
  assert.deepEqual(plain.map((group) => group.id), ["main"]);
  assert.deepEqual(plain[0]?.items[0]?.children?.map((item) => item.id), ["main.dashboard.overview"]);
  const analyst = visibleNavigation(groups, user("qc.pack", "hr.extra"));
  assert.deepEqual(analyst[1]?.items.map((item) => item.id), ["qc.testing"]);
  assert.deepEqual(analyst[1]?.items[0]?.children?.map((item) => item.id), ["qc.testing.pack"]);
  assert.equal(analyst[0]?.items[0]?.children?.length, 2);
});

test("finds the entry for an address, including detail pages and tab queries", () => {
  assert.equal(activeNavigation(groups, "/home")?.itemId, "main.dashboard.overview");
  assert.deepEqual(activeNavigation(groups, "/home")?.trail, ["main.dashboard"]);
  assert.equal(activeNavigation(groups, "/qc/specifications/42/edit")?.itemId, "qc.specs");
  assert.equal(activeNavigation(groups, "/qc/tests", "?type=1&page=2")?.itemId, "qc.testing.pack");
  assert.equal(activeNavigation(groups, "/qc/tests", "?type=9"), null);
  assert.equal(activeNavigation(groups, "/homework"), null);
});

test("lists each page once for search with its group and heading", () => {
  const pages = navigationPages(groups);
  assert.equal(pages.filter((page) => page.path === "/home").length, 1);
  assert.equal(pages.find((page) => page.path === "/qc/tests?type=0")?.context, "Quality Control · Testing");
});

test("the imported Oryx Next catalog is well formed", () => {
  const ids = new Set<string>();
  const visit = (item: NavigationGroup["items"][number]) => {
    assert.equal(ids.has(item.id), false, `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(item.path || item.children?.length, `${item.id} leads nowhere`);
    if (item.path) assert.match(item.path, /^\/[^/]/, `${item.id} path`);
    for (const child of item.children ?? []) visit(child);
  };
  for (const group of navigationCatalog) for (const item of group.items) visit(item);
  assert.equal(activeNavigation(navigationCatalog, "/access-management/roles/create")?.groupId, "it-support");
});

test("supplier and manufacturer directories belong to Procurement with their own permissions", () => {
  for (const [path, permission, itemId] of [
    ["/settings/suppliers", "CanViewVendors", "procurement.suppliers"],
    ["/settings/manufacturers", "CanViewManufacturers", "procurement.manufacturers"],
    ["/procurement/supplier-compliance", "CanViewSupplierCertifications", "procurement.supplier-compliance"],
  ] as const) {
    const visible = visibleNavigation(navigationCatalog, user(permission));
    assert.equal(activeNavigation(visible, path)?.groupId, "procurement");
    assert.equal(activeNavigation(visible, `${path}/record/edit`)?.itemId, itemId);
    assert.equal(visible.some((group) => group.id === "system-settings"), false);
    assert.equal(navigationPages(visible).filter((page) => page.path === path).length, 1);
  }
  const supplierOnly = visibleNavigation(navigationCatalog, user("CanViewVendors"));
  assert.equal(activeNavigation(supplierOnly, "/settings/manufacturers"), null);
  assert.deepEqual(navigationTrail(navigationCatalog, "/settings/suppliers/record/relationship").map((crumb) => crumb.label), ["Procurement", "Suppliers"]);
});

test("gives a page's place in the navigation, linking only the entry that is a page", () => {
  assert.deepEqual(navigationTrail(groups, "/qc/specifications/42/edit"), [{ label: "Quality Control" }, { label: "Specifications", path: "/qc/specifications" }]);
  assert.deepEqual(navigationTrail(groups, "/qc/tests", "?type=1"), [{ label: "Quality Control" }, { label: "Testing" }, { label: "Packaging", path: "/qc/tests?type=1" }]);
  assert.deepEqual(navigationTrail(groups, "/nowhere"), []);
  assert.deepEqual(navigationTrail(navigationCatalog, "/access-management/users/create").map((crumb) => crumb.label), ["IT Support", "User Management", "Manage Users Directory"]);
});

test("collection navigation is available to each collection's independent viewer", () => {
  for (const permission of collectionViewPermissions) {
    const visible = visibleNavigation(navigationCatalog, user(permission));
    assert.equal(activeNavigation(visible, "/settings/config")?.itemId, "system-settings.configuration-collections", permission);
  }
  assert.equal(activeNavigation(visibleNavigation(navigationCatalog, user()), "/settings/config"), null);
});
