// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { afterEach, expect, it, vi } from "vitest";
import { FormWizard, type WizardField } from "./form-wizard";
import { InputTypes } from "./input-types";

const schema = z.object({ documents: z.array(z.instanceof(File)) });
type Values = z.infer<typeof schema>;
const fields = [{ type: InputTypes.UPLOAD, name: "documents", label: "Documents", mode: "multiple",
  persisted: [{ id: "saved", name: "saved.png", url: "https://files.test/saved.png" }] },
  { type: InputTypes.SUBMIT, id: "save", label: "Save" }] as const satisfies readonly WizardField<Values>[];
const submit = vi.fn();
function Harness() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { documents: [] } });
  return <form onSubmit={form.handleSubmit((values) => { submit(values); })}><FormWizard form={form} fields={fields} /></form>;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); submit.mockClear(); });

it("opens persisted and selected uploads without submitting or changing the form", async () => {
  const user = userEvent.setup();
  const revoke = vi.fn();
  vi.stubGlobal("URL", class extends URL {
    static override createObjectURL = () => "blob:selected";
    static override revokeObjectURL = revoke;
  });
  render(<Harness />);
  await user.click(await screen.findByRole("button", { name: "saved.png" }));
  expect(await screen.findByRole("dialog", { name: "saved.png" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  const file = new File(["selected image"], "selected.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Documents"), file);
  await user.click(await screen.findByRole("button", { name: "selected.png" }));
  expect(await screen.findByRole("dialog", { name: "selected.png" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "selected.png" }).getAttribute("src")).toBe("blob:selected");
  expect(submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  expect(revoke).toHaveBeenCalledWith("blob:selected");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ documents: [file] }));
});
