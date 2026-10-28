// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { stockApi } from "./api/stock-api";
import { receipt, unitId } from "./fixture";
function Probe({ search }: { search: string }) {
  const query = stockApi.useStockRegisterQuery({ store: 0, status: 0, page: 1, pageSize: 20, search });
  return query.error ? <p role="alert">Unreadable stock</p> : query.currentData ? <p role="status">Rows {query.currentData.totalRecordCount}</p> : null;
}
function open(mode: "page" | "wrong-store" | "array" | "search") {
  const backend = stubBackend();
  const auth = backend.fetcher.getMockImplementation();
  const pages: number[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    expect(url.searchParams.get("store")).toBe("0");
    expect(url.searchParams.get("status")).toBe("0");
    const page = Number(url.searchParams.get("page"));
    pages.push(page);
    if (mode === "array") return Response.json([receipt]);
    const row =
      mode === "wrong-store"
        ? { ...receipt, item: { ...receipt.item, store: 1 } }
        : page === 1
          ? receipt
          : { ...receipt, id: unitId, item: { ...receipt.item, name: "Matching second page" } };
    return Response.json({ data: [row], pageIndex: page, pageCount: mode === "search" ? 2 : 1, totalRecordCount: mode === "search" ? 2 : 1 });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe search={mode === "search" ? "Matching" : ""} />
      </ApiProvider>
    </SessionProvider>,
  );
  return pages;
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("reads the actual pagination envelope and preserves store/status zero", async () => {
  open("page");
  await screen.findByText("Rows 1");
});
it("rejects stock returned from a different store", async () => {
  open("wrong-store");
  await screen.findByRole("alert");
});
it("does not accept the incorrect bare-array OpenAPI shape", async () => {
  open("array");
  await screen.findByRole("alert");
});
it("searches the complete scoped register rather than just the first page", async () => {
  const pages = open("search");
  await screen.findByText("Rows 1");
  expect(new Set(pages)).toEqual(new Set([1, 2]));
});
