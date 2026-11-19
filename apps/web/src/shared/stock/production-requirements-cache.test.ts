// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/base-api";
import { productApi } from "@/modules/products/api/product-api";
import { scheduleApi } from "@/modules/schedules/api/schedule-api";
import "@/modules/issue-bmr/api/issue-bmr-api";

afterEach(() => vi.unstubAllGlobals());
it("refreshes running batch packaging after a successful master save, with no refresh on failure", async () => {
  let reads = 0; let fail = true;
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async input => {
    if (!(input instanceof Request)) throw new Error("Expected a request");
    if (input.method === "GET") { reads++; return Response.json([]); }
    return fail ? Response.json({ title: "Invalid configuration" }, { status: 400 }) : new Response(null, { status: 204 });
  }));
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: defaults => defaults().concat(api.middleware) });
  const batch = store.dispatch(scheduleApi.endpoints.getApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductId.initiate({ productionScheduleProductId: "batch-1" }));
  await batch; expect(reads).toBe(1);
  const save = () => store.dispatch(productApi.endpoints.postApiV1ProductByProductIdPackages.initiate({ productId: "product-1", body: [] }));
  await save(); expect(reads).toBe(1);
  fail = false; await save();
  await vi.waitFor(() => expect(reads).toBe(2));
  batch.unsubscribe(); store.dispatch(api.util.resetApiState());
});
