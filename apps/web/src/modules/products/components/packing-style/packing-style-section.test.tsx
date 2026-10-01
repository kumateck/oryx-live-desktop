// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { chooseAction, openMenu } from "../../../../test/menu";
import { PackingStyleSection } from "./packing-style-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const bottle = { id: "u-bottle", name: "Bottle", symbol: "btl", type: 1 };
const styles = [
  { id: "11111111-1111-4111-8111-111111111111", name: "100 ml bottle", isDefault: true, basePackingQuantity: 100, packPerShipper: 24, expectedYield: 15000,
    basePackingUoM: bottle, packingLists: [{ uom: bottle, quantity: 1, order: 1 }] },
  { id: "22222222-2222-4222-8222-222222222222", name: "60 ml bottle", isDefault: false, basePackingQuantity: 60, packPerShipper: 48, expectedYield: 25000,
    basePackingUoM: bottle, packingLists: [{ uom: bottle, quantity: 1, order: 1 }] },
];

function open(saveStatus = 201) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const posts: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/collection/uom/paginated") return Response.json({ data: [bottle, { id: "u-ml", name: "Millilitre", symbol: "ml", type: 0 }] });
    if (path === `/api/v1/product/${id}/packing` && input.method === "GET") return Response.json(styles);
    if (path === `/api/v1/product/${id}/packing` && input.method === "POST") {
      posts.push(await input.clone().text());
      return saveStatus === 201 ? Response.json(id, { status: 201 })
        : Response.json({ errors: [{ code: "ProductPacking.Delete", description: "Cannot delete the following packing styles as they are already used in batch packaging records: 60 ml bottle" }] }, { status: saveStatus });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <PackingStyleSection productId={id} fullBatchSize={1_500_000} baseUnit="ml" /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return posts;
}

it("keeps edits as a draft, then saves the whole set with IDs and one default", async () => {
  const posts = open();
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  const save = screen.getByRole("button", { name: "Save packing styles" });
  expect(save.hasAttribute("disabled")).toBe(true);
  await chooseAction("Actions for 100 ml bottle", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(screen.queryByText("100 ml bottle")).toBeNull());
  expect(screen.getByText("You have changes that are not saved yet.")).toBeTruthy();
  // The remaining style became the default.
  expect(within(screen.getByText("60 ml bottle").closest("tr") ?? document.body).getByText("Default")).toBeTruthy();
  fireEvent.click(save);
  await waitFor(() => expect(posts).toHaveLength(1));
  expect(JSON.parse(posts[0] ?? "[]")).toEqual([expect.objectContaining({ id: "22222222-2222-4222-8222-222222222222", name: "60 ml bottle", isDefault: true,
    basePackingUomId: "u-bottle", packingLists: [{ uomId: "u-bottle", quantity: 1, order: 1 }] })]);
});

it("shows the server's reason when a style in use cannot be removed, and lets the user discard", async () => {
  open(412);
  expect(await screen.findByText("60 ml bottle")).toBeTruthy();
  await chooseAction("Actions for 60 ml bottle", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save packing styles" }));
  expect((await screen.findByRole("alert")).textContent).toContain("already used in batch packaging records");
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(await screen.findByText("60 ml bottle")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("opens the add dialog with the batch-based yield suggestion once a base quantity is typed", async () => {
  open();
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  await waitFor(() => expect(screen.getByRole("button", { name: "Add style" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Add style" }));
  const dialog = await screen.findByRole("dialog");
  // Fields load lazily; wait for the real input rather than its placeholder.
  fireEvent.change(await within(dialog).findByLabelText(/^Base packing quantity \(ml\)/, { selector: "input" }), { target: { value: "100" } });
  expect(await within(dialog).findByText(/A full batch fills about 15,000 base packs/)).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Add style" }));
  expect(await within(dialog).findByText("Enter a label")).toBeTruthy();
  expect(within(dialog).getByText("Choose a unit")).toBeTruthy();
});
