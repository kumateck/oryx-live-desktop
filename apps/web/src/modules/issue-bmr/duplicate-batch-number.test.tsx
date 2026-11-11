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

it.each([null, "LJK"])("retains a duplicate number for editing and issues a different number (stem %s)", async (stem) => {
  const original = stem ? "LJK097" : "BATCH-1";
  const replacement = stem ? "LJK098" : "BATCH-2";
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
      if (path === "/api/v1/production-schedule/manufacturing/bmr-1" && body.includes(original))
        return Response.json({ errors: [{ code: "Bmr.DuplicateBatchNumber", description: `Batch number '${original}' already exists. Use a different number.` }] }, { status: 409 });
      return new Response(null, { status: 204 });
    }
    if (path === "/api/v1/production-schedule/manufacturing/bmr-1") return Response.json({ id: "bmr-1", batchNumber: original,
      manufacturingDate: `${month}-01T00:00:00Z`, expiryDate: `${expiry}-01T00:00:00Z`, batchQuantity: 100,
      productionScheduleProduct: { id: "batch-1", product: { name: "Zinvite", code: "P001", batchStem: stem, baseUoM: { symbol: "piece" } } } });
    if (path.includes("material-stock")) return Response.json([]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/issue-bmr/:id", element: <IssueBmrDetailPage /> },
    { path: "/qa/issue-bmr", element: <p>Requests</p> }], { initialEntries: ["/qa/issue-bmr/bmr-1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Issue BMR and BPR" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Issue" }));
  expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent", `Batch number '${original}' already exists. Use a different number.`);
  expect(writes).toHaveLength(1);
  expect(writes.some(write => write.path.includes("/issue/"))).toBe(false);
  const user = userEvent.setup();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const number = screen.getByRole("textbox", { name: stem ? "Batch number · LJK" : "Batch number" });
  expect(number).toHaveProperty("value", stem ? "097" : original);
  await user.clear(number);
  if (stem) {
    await user.type(number, "A");
    await user.click(screen.getByRole("button", { name: "Issue BMR and BPR" }));
    expect(await screen.findByText(/Enter up to .* digits after the batch stem/)).toBeTruthy();
    expect(writes).toHaveLength(1);
    await user.clear(number);
  }
  await user.type(number, stem ? "098" : replacement);
  await user.click(screen.getByRole("button", { name: "Issue BMR and BPR" }));
  const confirm = await screen.findByRole("dialog", { name: `Issue batch ${replacement}?` });
  fireEvent.click(within(confirm).getByRole("button", { name: "Issue" }));
  await waitFor(() => expect(writes).toHaveLength(3));
  expect(writes[1]?.body).toContain(replacement);
  expect(writes[2]?.path).toContain("/issue/");
  expect(await screen.findByText("Requests")).toBeTruthy();
});
