// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormWizard, type WizardField } from "./form-wizard";
import { InputTypes } from "./input-types";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(cleanup);

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const schema = z.object({
  manufacturingMonth: month,
  expiryMonth: month,
  receivedDate: z.date().nullable(),
  inspectionRange: z.object({ from: z.date(), to: z.date().optional() }).nullable(),
}).refine(({ manufacturingMonth, expiryMonth }) => expiryMonth > manufacturingMonth,
  { path: ["expiryMonth"], message: "Expiry must follow manufacturing" });
type Values = z.infer<typeof schema>;

const fields = [
  { type: InputTypes.MONTH, name: "manufacturingMonth", label: "Manufacturing month" },
  { type: InputTypes.MONTH, name: "expiryMonth", label: "Expiry month" },
  { type: InputTypes.DATE, name: "receivedDate", label: "Received date" },
  { type: InputTypes.RANGE, name: "inspectionRange", label: "Inspection range" },
] as const satisfies readonly WizardField<Values>[];

it("wires month and calendar fields to Zod and submits month-only values", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: Values) => void>();
  function BatchForm() {
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: {
      manufacturingMonth: "2026-05", expiryMonth: "2026-04", receivedDate: null, inspectionRange: null,
    } });
    return <form noValidate onSubmit={form.handleSubmit(submit)}>
      <FormWizard form={form} fields={fields} /><button type="submit">Save batch</button>
    </form>;
  }

  render(<BatchForm />);
  expect(await screen.findByRole("button", { name: "Received date" })).toBeTruthy();
  expect(await screen.findByRole("button", { name: "Inspection range" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save batch" }));
  expect(await screen.findByText("Expiry must follow manufacturing")).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Expiry month" }));
  await user.click(screen.getByRole("combobox", { name: "Month" }));
  await user.click(screen.getByRole("option", { name: "June" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  await user.click(screen.getByRole("button", { name: "Save batch" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0]).toEqual({
    manufacturingMonth: "2026-05", expiryMonth: "2026-06", receivedDate: null, inspectionRange: null,
  }));
});
