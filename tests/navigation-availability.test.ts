import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { availableNavigation, hasConcretePage, pagePath } from "../apps/web/src/modules/navigation/availability.ts";
import { navigationPages } from "../apps/web/src/modules/navigation/navigation-model.ts";
import { navigationCatalog } from "../apps/web/src/modules/navigation/catalog.generated.ts";
async function files(directory: string): Promise<string[]> {
  const children = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(children.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : Promise.resolve(entry.name === "page.tsx" ? [join(directory, entry.name)] : [])))).flat();
}
test("available navigation never advertises an absent page, including catch-all-only and held destinations", async () => {
  const pages = (await files("apps/web/src/pages")).map(pagePath);
  const available = navigationPages(availableNavigation(navigationCatalog, pages));
  assert.ok(available.length > 100);
  for (const item of available) assert.ok(hasConcretePage(item.path, pages), item.path);
  for (const path of ["/qc/worksheets/templates", "/settings/full-procedures/areas", "/audit/quality-audits", "/rnd/projects"])
    assert.ok(!available.some((item) => item.path === path), path);
  for (const path of ["/qc/material-retests", "/qc/rework-tasks", "/warehouse/stock-discrepancies", "/logistics/shipment-discrepancies", "/qa/oos-investigations"])
    assert.ok(available.some((item) => item.path === path), path);
});
test("dynamic page patterns match only their exact length; unavailable parents retain available children without a dead link", () => {
  const pages = ["/warehouse/batches/[id]", "/home", "/[...rest]"];
  assert.ok(hasConcretePage("/warehouse/batches/b1?type=0", pages));
  assert.ok(!hasConcretePage("/warehouse/batches", pages));
  assert.ok(!hasConcretePage("/missing", pages));
  assert.deepEqual(availableNavigation([{ id: "g", label: "Group", items: [{ id: "p", label: "Parent", path: "/missing", children: [{ id: "c", label: "Home", path: "/home" }] }] }], pages)[0]?.items[0],
    { id: "p", label: "Parent", children: [{ id: "c", label: "Home", path: "/home" }] });
});
