import { expect, it } from "vitest";
import { destinationKey, internalDestination } from "./destinations";

it("keeps record and permission scopes distinct while reusing a filtered list", () => {
  const key = (path: string) => { const url = new URL(path, "https://oryx.test"); return destinationKey(url); };
  expect(key("/stock?department=A&kind=0&search=acid&page=2")).toBe(key("/stock?kind=0&department=A"));
  expect(key("/stock?department=A&kind=0")).not.toBe(key("/stock?department=B&kind=0"));
  expect(key("/stock?kind=0")).not.toBe(key("/stock?kind=1"));
  expect(key("/records/one")).not.toBe(key("/records/two"));
});

it("only offers internal application destinations for new workspace tabs", () => {
  expect(internalDestination("/production/products?department=one", "http://intranet")).toEqual({ pathname: "/production/products", search: "?department=one", hash: "" });
  for (const path of ["https://external.test/home", "javascript:alert(1)", "/api/v1/file/doc.pdf", "/login?next=/home", "/reset-password/token"]) {
    expect(internalDestination(path, "http://intranet")).toBeNull();
  }
});
