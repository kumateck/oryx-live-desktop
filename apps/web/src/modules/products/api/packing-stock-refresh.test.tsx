// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { fgText } from "@/shared/packing/fg-quantity";
import { noteSchema, useGetApiV1ProductionScheduleApprovedProductsQuery, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery } from "@/modules/finished-goods-notes/notes";
import { usePostApiV1ProductByProductIdPackingMutation, usePostApiV1ProductByProductIdPackingApprovedProductMutation } from "./product-api";

afterEach(() => { cleanup(); forgetSession(); });
const audit = { module: "Warehouse", subModule: "Approved Products" };
function Stock({ target }: { target: "product" | "approved-product" }) {
  const stock = useGetApiV1ProductionScheduleApprovedProductsQuery(audit);
  const note = useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery({ ...audit, id: "n" });
  const [saveProduct, productSave] = usePostApiV1ProductByProductIdPackingMutation();
  const [saveApproved, approvedSave] = usePostApiV1ProductByProductIdPackingApprovedProductMutation();
  const part = stock.currentData?.[0]?.stocks?.[0];
  const parsed = noteSchema.safeParse(note.currentData);
  const shown = parsed.success ? parsed.data : null;
  const save = () => void (target === "product" ? saveProduct : saveApproved)({ ...audit, productId: "p", body: [{ id: "packing", name: "18x20x30g", packPerShipper: 18 }] });
  return <>
    <output data-testid="stock">{part ? fgText(part.sent ?? 0, { perShipper: part.packsPerShipper ?? null, baseUnitsPerPack: part.quantityPerPack ?? null, packName: "Outer Carton", baseName: "Tube" }) : "Loading"}</output>
    <output data-testid="note">{shown ? fgText(shown.total, shown.layout) : "Loading"}</output>
    <button onClick={save}>Save style</button>
    {productSave.isError || approvedSave.isError ? <p role="alert">Save refused</p> : null}
  </>;
}
function Ready({ target }: { target: "product" | "approved-product" }) {
  return useCurrentUser() ? <Stock target={target} /> : null;
}
function open(target: "product" | "approved-product", fail = false) {
  const backend = stubBackend();
  const base = backend.fetcher.getMockImplementation();
  let changed = false;
  const reads: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request) {
      const path = new URL(input.url).pathname;
      if (input.method === "POST" && path.startsWith("/api/v1/product/p/packing")) {
        if (fail) return Response.json({ errors: [{ code: "Packing.Refused", description: "Save refused" }] }, { status: 412 });
        changed = true; return Response.json("p", { status: 201 });
      }
      if (path === "/api/v1/production-schedule/approved-products") {
        reads.push(path);
        return Response.json([{ product: { id: "p" }, stocks: [{ sent: 3_500_005, quantityPerPack: changed ? 20 : 1, packsPerShipper: changed ? 18 : 360 }] }]);
      }
      if (path === "/api/v1/production-schedule/finished-goods-transfer-note/n") {
        reads.push(path);
        return Response.json({ id: "n", totalQuantity: 3_500_005, quantityPerPack: 1, packsPerShipperSnapshot: 360,
          productPacking: { packPerShipper: changed ? 18 : 360, basePackingUoM: { name: "Tube" }, packingLists: [
            { uom: { name: "Shipper" }, quantity: 18, order: 1 }, { uom: { name: "Outer Carton" }, quantity: 20, order: 2 },
          ] } });
      }
    }
    return base ? base(input, init) : new Response(null, { status: 500 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><Ready target={target} /></ApiProvider></SessionProvider>);
  return reads;
}

it.each(["product", "approved-product"] as const)("refreshes mounted stock and note counts immediately after a %s packing save", async target => {
  open(target);
  await waitFor(() => expect(screen.getByTestId("stock").textContent).toBe("9,722 shippers · 85 loose"));
  fireEvent.click(screen.getByRole("button", { name: "Save style" }));
  await waitFor(() => expect(screen.getByTestId("stock").textContent).toBe("9,722 shippers · 4 loose · 5 tubes"));
  await waitFor(() => expect(screen.getByTestId("note").textContent).toBe("9,722 shippers · 4 loose · 5 tubes"));
});

it("keeps stock counts and caches unchanged after a refused packing save", async () => {
  const reads = open("approved-product", true);
  await waitFor(() => expect(screen.getByTestId("stock").textContent).toBe("9,722 shippers · 85 loose"));
  const before = reads.length;
  fireEvent.click(screen.getByRole("button", { name: "Save style" }));
  await screen.findByRole("alert");
  expect(reads.length).toBe(before);
  expect(screen.getByTestId("stock").textContent).toBe("9,722 shippers · 85 loose");
});
