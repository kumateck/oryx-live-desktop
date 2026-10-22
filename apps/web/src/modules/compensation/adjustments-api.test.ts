// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it } from "vitest";
import { compensationApi } from "./api/compensation-api";
import { forgetSession, stubBackend } from "@/test/backend";
const employeeId = "258da105-a506-44a9-8ff5-8d005a54f294";
const item = (index: number) => ({
  id: `558da105-a506-44a9-8ff5-${String(index).padStart(12, "0")}`,
  employeeId,
  type: 0,
  amount: 0,
  isRecurring: false,
  isTaxable: false,
  effectiveFrom: "2026-01-01T00:00:00Z",
});
afterEach(forgetSession);
it("reads every adjustment page rather than silently showing only the first twenty records", async () => {
  const backend = stubBackend();
  const calls: number[] = [];
  backend.fetcher.mockImplementation(async (input) => {
    if (!(input instanceof Request)) return new Response(null, { status: 500 });
    const page = Number(new URL(input.url).searchParams.get("page"));
    calls.push(page);
    return Response.json({
      pageIndex: page,
      pageCount: 2,
      totalRecordCount: 101,
      data: page === 1 ? Array.from({ length: 100 }, (_, index) => item(index)) : [item(100)],
    });
  });
  const store = configureStore({
    reducer: { [compensationApi.reducerPath]: compensationApi.reducer },
    middleware: (defaults) => defaults().concat(compensationApi.middleware),
  });
  try {
    const rows = await store.dispatch(compensationApi.endpoints.compensationAdjustments.initiate({ employeeId, kind: "addition" })).unwrap();
    expect(rows).toHaveLength(101);
    expect(calls).toEqual([1, 2]);
    expect(rows[0]).toMatchObject({ type: 0, amount: 0, isTaxable: false });
  } finally {
    store.dispatch(compensationApi.util.resetApiState());
  }
});
it("refuses another employee's adjustments without exposing the returned records", async () => {
  const backend = stubBackend();
  backend.fetcher.mockImplementation(async () =>
    Response.json({ pageIndex: 1, pageCount: 1, totalRecordCount: 1, data: [{ ...item(0), employeeId: "558da105-a506-44a9-8ff5-8d005a54f294" }] }),
  );
  const store = configureStore({
    reducer: { [compensationApi.reducerPath]: compensationApi.reducer },
    middleware: (defaults) => defaults().concat(compensationApi.middleware),
  });
  try {
    await expect(store.dispatch(compensationApi.endpoints.compensationAdjustments.initiate({ employeeId, kind: "deduction" })).unwrap()).rejects.toMatchObject({
      status: "CUSTOM_ERROR",
    });
  } finally {
    store.dispatch(compensationApi.util.resetApiState());
  }
});
