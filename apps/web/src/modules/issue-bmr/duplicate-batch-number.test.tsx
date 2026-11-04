// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { currentMonth } from "@/shared/batch-dates/batch-dates";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { IssueBmrDetailPage } from "./components/issue-bmr-detail";

afterEach(() => { cleanup(); forgetSession(); });

it("shows the duplicate-number save error, retains entered details and never issues until a different number saves", async () => {
  const backend = stubBackend({ permissions: ["CanViewIssuedBmrBprs", "CanIssueBmr"] });
  rememberSession();
  const writes: { path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  const month = currentMonth();
  const expiry = `${Number(month.slice(0, 4)) + 2}${month.slice(4)}`;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") {
      const body = await input.clone().text();
      writes.push({ path, body });
      if (path === "/api/v1/production-schedule/manufacturing/bmr-1" && body.includes("BATCH-1"))
        return Response.json({ errors: [{ code: "Bmr.DuplicateBatchNumber", description: "Batch number 'BATCH-1' already exists. Use a different number." }] }, { status: 409 });
      return new Response(null, { status: 204 });
    }
    if (path === "/api/v1/production-schedule/manufacturing/bmr-1") return Response.json({ id: "bmr-1", batchNumber: "BATCH-1",
      manufacturingDate: `${month}-01T00:00:00Z`, expiryDate: `${expiry}-01T00:00:00Z`, batchQuantity: 100,
      productionScheduleProduct: { id: "batch-1", product: { name: "Zinvite", code: "P001", baseUoM: { symbol: "piece" } } } });
    if (path.includes("material-stock")) return Response.json([]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/issue-bmr/:id", element: <IssueBmrDetailPage /> },
    { path: "/qa/issue-bmr", element: <p>Requests</p> }], { initialEntries: ["/qa/issue-bmr/bmr-1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Issue BMR and BPR" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Issue" }));
  expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent", "Batch number 'BATCH-1' already exists. Use a different number.");
  expect(writes).toHaveLength(1);
  expect(writes.some(write => write.path.includes("/issue/"))).toBe(false);
  const user = userEvent.setup();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByRole("textbox", { name: "Batch number" })).toHaveProperty("value", "BATCH-1");
  await user.clear(screen.getByRole("textbox", { name: "Batch number" }));
  await user.type(screen.getByRole("textbox", { name: "Batch number" }), "BATCH-2");
  await user.click(screen.getByRole("button", { name: "Issue BMR and BPR" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue" }));
  await waitFor(() => expect(writes).toHaveLength(3));
  expect(writes[1]?.body).toContain("BATCH-2");
  expect(writes[2]?.path).toContain("/issue/");
  expect(await screen.findByText("Requests")).toBeTruthy();
});
