// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import { FormWizard, type CustomFieldProps, type WizardField } from "./form-wizard";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(18, "Must be 18 or older"),
  notes: z.string(),
  role: z.object({ value: z.enum(["buyer", "seller"]), label: z.string() }),
  approved: z.boolean(),
});
type Values = z.infer<typeof schema>;

const fields = [
  { type: InputTypes.TEXT, name: "name", label: "Name", required: true },
  { type: InputTypes.NUMBER, name: "age", label: "Age" },
  { type: InputTypes.TEXTAREA, name: "notes", label: "Notes" },
  { type: InputTypes.SELECT, mode: "single", source: "sync", name: "role", label: "Role", options: [{ value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" }] },
  { type: InputTypes.CHECKBOX, name: "approved", label: "Approved" },
] as const satisfies readonly WizardField<Values>[];

function ExampleForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", age: 0, notes: "", role: { value: "buyer", label: "Buyer" }, approved: false },
  });
  return <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
    <FormWizard form={form} fields={fields} />
    <button type="submit">Save</button>
  </form>;
}

afterEach(cleanup);

it("validates and submits only the declared fields", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn<(values: Values) => void>();
  render(<ExampleForm onSubmit={onSubmit} />);

  await screen.findByRole("textbox", { name: "Name" });
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText("Name is required")).toBeTruthy();
  expect(screen.getByText("Must be 18 or older")).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();

  await user.type(await screen.findByRole("textbox", { name: "Name" }), "Ada");
  await user.clear(screen.getByRole("spinbutton", { name: "Age" }));
  await user.type(screen.getByRole("spinbutton", { name: "Age" }), "24");
  await user.type(screen.getByRole("textbox", { name: "Notes" }), "Priority supplier");
  await user.click(screen.getByRole("combobox", { name: "Role" }));
  await user.click(await screen.findByRole("option", { name: "Seller" }));
  await user.click(screen.getByRole("checkbox", { name: "Approved" }));
  await user.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(onSubmit.mock.calls[0]?.[0]).toEqual({
    name: "Ada", age: 24, notes: "Priority supplier", role: { value: "seller", label: "Seller" }, approved: true,
  }));
});

it("loads a domain field on demand and preserves label wiring", async () => {
  const load = vi.fn(async () => ({ default: function CustomNotes({ id, name, control, describedBy }: CustomFieldProps<Values>) {
    const { field } = useController({ name, control });
    return <input id={id} value={String(field.value ?? "")} onChange={field.onChange} aria-describedby={describedBy} />;
  } }));
  const customFields = [{ type: InputTypes.CUSTOM, name: "notes", label: "Custom notes", description: "Internal use", load }] as const satisfies readonly WizardField<Values>[];

  function CustomForm() {
    const form = useForm<Values>({ defaultValues: { notes: "Original" } });
    return <FormWizard form={form} fields={customFields} />;
  }

  render(<CustomForm />);
  const input = await screen.findByRole("textbox", { name: "Custom notes" });
  expect(input.getAttribute("aria-describedby")).toBeTruthy();
  expect(load).toHaveBeenCalled();
});

it("selects and clears full option objects in a multi-select", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: { roles: { value: string; label: string }[] }) => void>();
  const multiFields = [{ type: InputTypes.SELECT, mode: "multiple", source: "sync", name: "roles", label: "Roles",
    options: [{ value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" }] }] as const satisfies readonly WizardField<{ roles: { value: string; label: string }[] }>[];
  function MultiForm() {
    const form = useForm<{ roles: { value: string; label: string }[] }>({ defaultValues: { roles: [] } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={multiFields} /><button type="submit">Save roles</button></form>;
  }
  render(<MultiForm />);
  await user.click(await screen.findByRole("button", { name: "Roles" }));
  await user.click(screen.getByText("Buyer"));
  await user.click(screen.getByText("Seller"));
  await user.click(screen.getByRole("button", { name: "Save roles" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].roles).toEqual([
    { value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" },
  ]));
  await user.click(screen.getByRole("button", { name: "Clear Roles" }));
  await user.click(screen.getByRole("button", { name: "Save roles" }));
  await waitFor(() => expect(submit.mock.calls[1]?.[0].roles).toEqual([]));
});

it("keeps selected options across async pages", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: { roles: { value: string; label: string }[] }) => void>();
  const loadOptions = vi.fn(async (_search: string, page: number, _signal: AbortSignal) => ({
    options: page === 1 ? [{ value: "buyer", label: "Buyer" }] : [{ value: "seller", label: "Seller" }],
    hasNext: page === 1,
    hasPrevious: page > 1,
  }));
  const asyncFields = [{ type: InputTypes.SELECT, mode: "multiple", source: "async", name: "roles", label: "Roles",
    loadOptions, debounceMs: 0 }] as const satisfies readonly WizardField<{ roles: { value: string; label: string }[] }>[];
  function AsyncForm() {
    const form = useForm<{ roles: { value: string; label: string }[] }>({ defaultValues: { roles: [] } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={asyncFields} /><button type="submit">Save roles</button></form>;
  }
  render(<AsyncForm />);
  await user.click(await screen.findByRole("button", { name: "Roles" }));
  await user.click(await screen.findByText("Buyer"));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(await screen.findByText("Seller"));
  await user.type(screen.getByRole("textbox", { name: "Search Roles" }), "b");
  await waitFor(() => expect(loadOptions).toHaveBeenCalledWith("b", 1, expect.any(AbortSignal)));
  await user.click(screen.getByRole("button", { name: "Save roles" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].roles).toEqual([
    { value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" },
  ]));
  expect(loadOptions).toHaveBeenCalledWith("", 1, expect.any(AbortSignal));
  expect(loadOptions).toHaveBeenCalledWith("", 2, expect.any(AbortSignal));
});

it("submits an async single-select option", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: { role: { value: string; label: string } | null }) => void>();
  const loadOptions = vi.fn(async () => ({ options: [{ value: "buyer", label: "Buyer" }], hasNext: false, hasPrevious: false }));
  const asyncFields = [{ type: InputTypes.SELECT, mode: "single", source: "async", name: "role", label: "Role",
    loadOptions, debounceMs: 0 }] as const satisfies readonly WizardField<{ role: { value: string; label: string } | null }>[];
  function AsyncForm() {
    const form = useForm<{ role: { value: string; label: string } | null }>({ defaultValues: { role: null } });
    return <form onSubmit={form.handleSubmit(submit)}><FormWizard form={form} fields={asyncFields} /><button type="submit">Save role</button></form>;
  }
  render(<AsyncForm />);
  await user.click(await screen.findByRole("combobox", { name: "Role" }));
  await user.click(await screen.findByText("Buyer"));
  await user.click(screen.getByRole("button", { name: "Save role" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].role).toEqual({ value: "buyer", label: "Buyer" }));
  expect(loadOptions).toHaveBeenCalled();
});
