// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { FormWizard, type WizardField } from "./form-wizard";
import { PasswordInput } from "./password-input";
import { InputTypes } from "./input-types";

afterEach(cleanup);

interface Values { email: string; password: string }
const fields = [
  { type: InputTypes.EMAIL, name: "email", label: "Email" },
  { type: InputTypes.PASSWORD, name: "password", label: "Password", required: true },
] as const satisfies readonly WizardField<Values>[];

function LoginForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({ defaultValues: { email: "", password: "" } });
  return <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}><FormWizard form={form} fields={fields} /><button type="submit">Sign in</button></form>;
}

it("hides the password by default and shows it on request, in a form wizard field", async () => {
  const submitted = vi.fn();
  render(<LoginForm onSubmit={submitted} />);
  // The field is loaded lazily; wait for the real input rather than its placeholder.
  const toggleReady = await screen.findByRole("button", { name: "Show password" });
  const box = screen.getByLabelText(/^Password/, { selector: "input" }) as HTMLInputElement;
  expect(box.type).toBe("password");
  fireEvent.change(box, { target: { value: "s3cret" } });
  const toggle = toggleReady;
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(toggle);
  expect(box.type).toBe("text");
  expect(box.value).toBe("s3cret");
  expect(screen.getByRole("button", { name: "Hide password" }).getAttribute("aria-pressed")).toBe("true");
  // Submitting hides it again and still sends the value.
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await vi.waitFor(() => expect(submitted).toHaveBeenCalledWith({ email: "", password: "s3cret" }, expect.anything()));
  expect(box.type).toBe("password");
});

it("never reveals a disabled field, and warns about Caps Lock while typing", () => {
  const view = render(<PasswordInput aria-label="Password" defaultValue="x" />);
  const box = screen.getByLabelText("Password") as HTMLInputElement;
  fireEvent.click(screen.getByRole("button", { name: "Show password" }));
  expect(box.type).toBe("text");
  expect(box.getAttribute("spellcheck")).toBe("false");
  fireEvent.keyUp(box, { key: "A", modifierCapsLock: true });
  expect(screen.getByRole("status").textContent).toBe("Caps Lock is on.");
  fireEvent.blur(box);
  expect(screen.queryByRole("status")).toBeNull();
  view.rerender(<PasswordInput aria-label="Password" defaultValue="x" disabled />);
  expect(box.type).toBe("password");
  expect(screen.getByRole("button", { name: "Show password" }).hasAttribute("disabled")).toBe(true);
});
