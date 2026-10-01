// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { FormWizard, type WizardField } from "./form-wizard";
import { InputTypes } from "./input-types";

document.elementFromPoint = () => document.body;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = () => {
  const rect = new DOMRect();
  return { length: 1, item: () => rect, 0: rect, [Symbol.iterator]: () => [rect].values() };
};
afterEach(cleanup);

interface Values { remarks: string }
const fields = [{ type: InputTypes.RICHTEXT, name: "remarks", label: "Remarks", placeholder: "Enter remarks" }] as const satisfies readonly WizardField<Values>[];

it("loads the editor only for its field, edits HTML, and follows form reset", async () => {
  const user = userEvent.setup();
  const submit = vi.fn<(values: Values) => void>();
  function Example() {
    const form = useForm<Values>({ defaultValues: { remarks: "<p>Original</p>" } });
    return <form onSubmit={form.handleSubmit(submit)}>
      <FormWizard form={form} fields={fields} />
      <button type="button" onClick={() => form.reset({ remarks: "<p>Reset content</p>" })}>Reset form</button>
      <button type="submit">Save</button>
    </form>;
  }
  render(<Example />);
  const editor = await screen.findByRole("textbox", { name: "Remarks" });
  expect(editor.textContent).toContain("Original");
  editor.focus();
  await user.type(editor, "X", { skipClick: true });
  await user.click(screen.getByRole("button", { name: "Expand editor" }));
  expect(screen.getAllByRole("textbox", { name: "Remarks" })).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Close" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit.mock.calls[0]?.[0].remarks).toContain("X"));
  await user.click(screen.getByRole("button", { name: "Reset form" }));
  await waitFor(() => expect(editor.textContent).toContain("Reset content"));
  await user.click(screen.getByRole("button", { name: "Table" }));
  await user.clear(screen.getByRole("spinbutton", { name: "Table rows" }));
  await user.type(screen.getByRole("spinbutton", { name: "Table rows" }), "2");
  await user.clear(screen.getByRole("spinbutton", { name: "Table columns" }));
  await user.type(screen.getByRole("spinbutton", { name: "Table columns" }), "2");
  await user.click(screen.getByRole("menuitem", { name: "Insert table" }));
  expect(editor.querySelectorAll("tr")).toHaveLength(2);
  await user.click(screen.getByRole("button", { name: "Link" }));
  await user.type(screen.getByRole("textbox", { name: "Link URL" }), "javascript:alert(1)");
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByRole("alert").textContent).toContain("HTTP");
});
