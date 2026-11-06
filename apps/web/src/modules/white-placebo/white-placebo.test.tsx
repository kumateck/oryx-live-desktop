// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { RecipeForm } from "./components/recipe-form";
import { QuantityInput } from "./components/quantity-input";
import { PreparationForm } from "./components/preparation-form";
import { preparationStatus, yieldPercent } from "./lib/white-placebo";
import { outputFormSchema, preparationFormSchema, type PreparationFormValues, type RecipeFormValues, type Workspace } from "./schemas/white-placebo";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
const outputId = "00000000-0000-4000-8000-000000000001";
const ingredientId = "00000000-0000-4000-8000-000000000002";
const unitId = "00000000-0000-4000-8000-000000000003";
const shelfId = "00000000-0000-4000-8000-000000000004";
const workspace: Workspace = {
  materials: [
    { id: outputId, name: "White Placebo", code: "WP001", unitSymbol: "mg", uoMId: unitId, isWhitePlacebo: true },
    { id: ingredientId, name: "Illustrative excipient", code: "RM001", unitSymbol: "mg", uoMId: unitId, isWhitePlacebo: false },
  ], stock: [], recipe: { materialId: outputId, materialName: "White Placebo", unitSymbol: "mg", revision: 3,
    reference: "SITE/APPROVED/001", instructions: "Follow the approved site procedure", storageConditions: "Site-approved storage", holdHours: 24,
    expectedQuantity: 10_000_000, ingredients: [{ materialId: ingredientId, name: "Illustrative excipient", code: "RM001", uoMId: unitId, unitSymbol: "mg", quantity: 10_000_000 }] },
};

it("keeps recipe edits and their original revision when a save fails", async () => {
  const user = userEvent.setup();
  const save = vi.fn<(values: RecipeFormValues, revision: number) => Promise<string | null>>(async () => "The recipe changed. Reload before saving.");
  const router = createMemoryRouter([{ path: "*", element: <RecipeForm workspace={workspace} saving={false} save={save} /> }]);
  render(<RouterProvider router={router} />);
  const reference = await screen.findByRole("textbox", { name: /Approved recipe reference/ });
  await user.clear(reference); await user.type(reference, "SITE/APPROVED/002");
  await user.click(screen.getByRole("button", { name: "Save recipe" }));
  await screen.findByRole("alert");
  expect(save.mock.calls[0]?.[1]).toBe(3);
  expect(screen.getByRole("textbox", { name: /Approved recipe reference/ })).toHaveProperty("value", "SITE/APPROVED/002");
  expect(screen.getByRole("combobox", { name: /White Placebo material/ })).toHaveProperty("disabled", true);
});

it("switches entry units without changing the stored amount and preserves entered decimals", async () => {
  const changed = vi.fn();
  const user = userEvent.setup();
  render(<QuantityInput id="weight" label="Actual net weight" value={9_812_345} unit="mg" onChange={changed} />);
  expect(screen.getByRole("spinbutton")).toHaveProperty("value", "9.812345");
  await user.click(screen.getByRole("combobox", { name: "Actual net weight unit" }));
  await user.click(screen.getByRole("option", { name: /^g$/ }));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByRole("spinbutton")).toHaveProperty("value", "9812.345");
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "9812.3456" } });
  await waitFor(() => expect(changed).toHaveBeenLastCalledWith(9_812_345.6));
});

it("requires distinct positive ingredient batches and valid weighed output", () => {
  const input = { shelfMaterialBatchId: shelfId, quantity: 10 };
  expect(preparationFormSchema.safeParse({ batchNumber: "WP-1", expectedQuantity: 10, notes: "", inputs: [input, input] }).success).toBe(false);
  expect(outputFormSchema.safeParse({ quantity: 0, preparedAt: "2026-11-03T10:00", notes: "Measured" }).success).toBe(false);
  expect(outputFormSchema.safeParse({ quantity: 9.8, preparedAt: "invalid", notes: "Measured" }).success).toBe(false);
  expect(yieldPercent(9.8, 10)).toBeCloseTo(98);
});

it("does not describe recorded output as available before QC and shelving", () => {
  const item = { rejected: false, issuedAt: "2026-11-03T08:00:00Z", outputBatchId: outputId, approved: true,
    qualityStatus: 1, useBy: "2026-11-04T10:00:00Z" };
  const now = new Date("2026-11-03T10:00:00Z");
  expect(preparationStatus(item, now)).toBe("Quality control");
  expect(preparationStatus({ ...item, qualityStatus: 8 }, now)).toBe("Awaiting shelf allocation");
  expect(preparationStatus({ ...item, qualityStatus: 3 }, now)).toBe("Available");
  expect(preparationStatus({ ...item, qualityStatus: 3 }, new Date("2026-11-05"))).toBe("Holding period ended");
});

it("creates and retains a preparation request ID on HTTP when saving is refused", async () => {
  vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
  const user = userEvent.setup();
  const save = vi.fn<(values: PreparationFormValues, id: string, revision: number) => Promise<string | null>>(async () => "Fixture save refused");
  const recipe = workspace.recipe;
  if (!recipe) throw new Error("Missing recipe fixture");
  const stock = [{ id: shelfId, materialId: ingredientId, materialName: "Illustrative excipient", batchNumber: "LOT-1",
    shelf: "S1", unitSymbol: "mg", quantity: 10_000_000, expiryDate: null }];
  const router = createMemoryRouter([{ path: "*", element: <PreparationForm recipe={recipe} stock={stock} saving={false} save={save} /> }]);
  render(<RouterProvider router={router} />);
  await user.type(await screen.findByLabelText(/White Placebo batch number/), "WP-HTTP");
  await user.click(screen.getByRole("combobox", { name: /Ingredient batch 1/ }));
  await user.click(screen.getByRole("option", { name: /LOT-1/ }));
  await user.click(screen.getByRole("button", { name: "Request ingredients" }));
  await screen.findByText("Fixture save refused");
  expect(save.mock.calls[0]?.[1]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  await user.click(screen.getByRole("button", { name: "Request ingredients" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(save.mock.calls[1]?.[1]).toBe(save.mock.calls[0]?.[1]);
});

