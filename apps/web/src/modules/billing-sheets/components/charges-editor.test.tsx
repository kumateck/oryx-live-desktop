// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { addChargesSchema, type AddChargesValues } from "../schemas/billing-schema";
import { ChargesEditor, emptyCharge } from "./charges-editor";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(cleanup);

const charges = [
  { value: "port", label: "Port handling" },
  { value: "customs", label: "Customs duty" },
  { value: "scanning", label: "Scanning" },
];
const usd = { value: "usd", label: "US Dollar" };
const ghs = { value: "ghs", label: "Ghana Cedi" };
const currencies = [usd, ghs];

function Editor({ defaultCurrency = null, onSave = () => {} }: {
  defaultCurrency?: SelectOption | null; onSave?: (values: AddChargesValues) => void;
}) {
  const form = useForm<AddChargesValues>({ resolver: zodResolver(addChargesSchema),
    defaultValues: { currency: null, charges: [emptyCharge()] } });
  return <FormProvider {...form}><form noValidate onSubmit={form.handleSubmit(onSave)}>
    <ChargesEditor charges={charges} currencies={currencies} loading={false} defaultCurrency={defaultCurrency} />
    <button type="submit">Save</button>
  </form></FormProvider>;
}

it("filters selected charges, keeps the row's own choice, and restores changed or removed choices", async () => {
  const user = userEvent.setup();
  render(<Editor />);
  const selectCharge = async (index: number, name: string) => {
    const trigger = screen.getAllByRole("combobox", { name: /^Charge/ })[index];
    if (!trigger) throw new Error("Missing charge row");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name }));
  };
  await screen.findByRole("combobox", { name: /^Charge/ });
  await selectCharge(0, "Port handling");
  await user.click(screen.getByRole("button", { name: "Add charge" }));
  const second = screen.getAllByRole("combobox", { name: /^Charge/ })[1];
  if (!second) throw new Error("Missing second row");
  await user.click(second);
  expect(screen.queryByRole("option", { name: "Port handling" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Customs duty" }));
  await user.click(screen.getAllByRole("combobox", { name: /^Charge/ })[0] ?? second);
  expect(await screen.findByRole("option", { name: "Port handling" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: "Customs duty" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Scanning" }));
  await user.click(screen.getByRole("button", { name: "Add charge" }));
  await selectCharge(2, "Port handling");
  expect((screen.getByRole("button", { name: "Add charge" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: "Remove charge 2" }));
  expect((screen.getByRole("button", { name: "Add charge" }) as HTMLButtonElement).disabled).toBe(false);
  await user.click(screen.getByRole("button", { name: "Add charge" }));
  await selectCharge(2, "Customs duty");
  expect(screen.getAllByRole("combobox", { name: /^Charge/ }).map((trigger) => trigger.textContent)).toEqual(["Scanning", "Port handling", "Customs duty"]);
});

it("defaults the shared currency when it arrives and keeps an explicit choice for later rows", async () => {
  const user = userEvent.setup();
  const onSave = vi.fn<(values: AddChargesValues) => void>();
  const view = render(<Editor onSave={onSave} />);
  await screen.findByRole("combobox", { name: /Currency/ });
  view.rerender(<Editor defaultCurrency={usd} onSave={onSave} />);
  await waitFor(() => expect(screen.getByRole("combobox", { name: /Currency/ }).textContent).toContain("US Dollar"));
  await user.click(screen.getByRole("combobox", { name: /Currency/ }));
  await user.click(await screen.findByRole("option", { name: "Ghana Cedi" }));
  await user.click(screen.getByRole("combobox", { name: /^Charge/ }));
  await user.click(await screen.findByRole("option", { name: "Port handling" }));
  await user.type(screen.getByRole("spinbutton", { name: /Amount/ }), "12.5");
  await user.click(screen.getByRole("button", { name: "Add charge" }));
  const second = screen.getAllByRole("combobox", { name: /^Charge/ })[1];
  const amount = screen.getAllByRole("spinbutton", { name: /Amount/ })[1];
  if (!second || !amount) throw new Error("Missing second row");
  await user.click(second);
  await user.click(await screen.findByRole("option", { name: "Customs duty" }));
  await user.type(amount, "9");
  view.rerender(<Editor defaultCurrency={{ ...usd }} onSave={onSave} />);
  expect(screen.getAllByRole("combobox", { name: /Currency/ })).toHaveLength(1);
  expect(screen.getByRole("combobox", { name: /Currency/ }).textContent).toContain("Ghana Cedi");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(onSave.mock.calls[0]?.[0]).toEqual({ currency: ghs, charges: [
    { charge: charges[0], amount: 12.5 }, { charge: charges[1], amount: 9 },
  ] });
});

it("requires the common currency and still rejects duplicate charge IDs at validation", () => {
  const line = { charge: charges[0], amount: 1 };
  const missing = addChargesSchema.safeParse({ currency: null, charges: [line] });
  expect(missing.success).toBe(false);
  if (!missing.success) expect(missing.error.issues).toContainEqual(expect.objectContaining({ path: ["currency"], message: "Choose the currency" }));
  const duplicate = addChargesSchema.safeParse({ currency: usd, charges: [line, line] });
  expect(duplicate.success).toBe(false);
  if (!duplicate.success) expect(duplicate.error.issues).toContainEqual(expect.objectContaining({ path: ["charges", 1, "charge"], message: "This charge is already on the sheet" }));
});
