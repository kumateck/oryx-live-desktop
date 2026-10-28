// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { vendorSearchApi } from "./api/vendor-search";
const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
const other = "79e15fc7-4f91-45e3-abbb-330d35956510";
const row = {
  id,
  name: "First vendor",
  address: "Address",
  phone: "1234567890",
  email: "first@example.com",
  contactPerson: "Contact",
  countryId: id,
  currencyId: id,
  items: [{ item: { id, name: "Item", store: 0 } }],
};
function Search() {
  const query = vendorSearchApi.useSearchStoreVendorsQuery("second");
  return query.isError ? <p role="alert">Unavailable</p> : query.currentData ? <p role="status">{query.currentData.map((r) => r.name).join(",")}</p> : null;
}
function Ready() {
  const user = useCurrentUser();
  return user ? <Search /> : null;
}
function open(fail = false) {
  const backend = stubBackend({ permissions: ["CanViewVendors"] });
  const auth = backend.fetcher.getMockImplementation();
  const pages: number[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const page = Number(new URL(input.url).searchParams.get("page"));
    pages.push(page);
    if (fail && page === 2) return new Response(null, { status: 503 });
    return Response.json({
      data: [page === 1 ? row : { ...row, id: other, name: "Second vendor", email: "second@example.com" }],
      pageIndex: page,
      pageCount: 2,
      totalRecordCount: 2,
    });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Ready />
      </ApiProvider>
    </SessionProvider>,
  );
  return pages;
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("searches every server page when the backend ignores its search parameter", async () => {
  const pages = open();
  expect((await screen.findByRole("status")).textContent).toBe("Second vendor");
  expect(pages).toEqual([1, 2]);
});
it("does not display partial search results when a later page fails", async () => {
  const pages = open(true);
  await screen.findByRole("alert");
  expect(screen.queryByRole("status")).toBeNull();
  expect(pages).toEqual([1, 2]);
});
