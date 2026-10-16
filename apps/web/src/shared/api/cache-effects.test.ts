import { configureStore } from "@reduxjs/toolkit";
import { expect, it, vi } from "vitest";
import { api } from "./base-api";
import { cacheEffects, cacheEffectsMiddleware } from "./cache-effects";

it("names the document an approval decided, and a batch's QC steps, from the save's arguments", () => {
  expect(cacheEffects.postApiV1ApprovalApproveByModelTypeAndModelId?.({ modelType: "ShipmentDocument", modelId: "sd-1" })).toEqual([
    { type: "procurement/shipment-document", id: "sd-1" }, { type: "procurement/shipment-document", id: "LIST" },
    { type: "procurement/shipment", id: "sd-1" }, { type: "procurement/shipment", id: "LIST" },
  ]);
  expect(cacheEffects.postApiV1ApprovalRejectByModelTypeAndModelId?.({ modelType: "SomethingNew", modelId: "x" })).toEqual([]);
  expect(cacheEffects.postApiV1FormAssignees?.({ domainEntitiesFormsRequestCreateFormAssigneeRequest: { formId: "f", materialBatchId: "b-1" } })).toEqual([
    { type: "material/batch", id: "b-1" }, { type: "material/batch", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/grn", id: "LIST" }, { type: "qa/analytical-test", id: "LIST" },
  ]);
});

const reads = new Map<string, number>();
const probe = api.injectEndpoints({ endpoints: (build) => ({
  effectProbeShipment: build.query<number, string>({ providesTags: (_result, _error, id) => [{ type: "procurement/shipment-document", id }],
    queryFn: (id) => { const count = (reads.get(id) ?? 0) + 1; reads.set(id, count); return { data: count }; } }),
  // Named as the generated endpoint, whose own URL says nothing of the shipment it decides.
  postApiV1ApprovalApproveByModelTypeAndModelId: build.mutation<null, { modelType: string; modelId: string; fail?: boolean }>({ queryFn: (arg) => arg.fail ? { error: { status: 500, data: null } } : { data: null } }),
}) });

it("refreshes exactly the shipment an approval decided, and nothing after a failed decision", async () => {
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware, cacheEffectsMiddleware.middleware) });
  const decided = store.dispatch(probe.endpoints.effectProbeShipment.initiate("sd-1"));
  const other = store.dispatch(probe.endpoints.effectProbeShipment.initiate("sd-2"));
  await Promise.all([decided, other]);
  await store.dispatch(probe.endpoints.postApiV1ApprovalApproveByModelTypeAndModelId.initiate({ modelType: "ShipmentDocument", modelId: "sd-1", fail: true }));
  await store.dispatch(probe.endpoints.postApiV1ApprovalApproveByModelTypeAndModelId.initiate({ modelType: "ShipmentDocument", modelId: "sd-1" }));
  await vi.waitFor(() => expect(reads.get("sd-1")).toBe(2));
  expect(reads.get("sd-2")).toBe(1);
  decided.unsubscribe(); other.unsubscribe();
});
