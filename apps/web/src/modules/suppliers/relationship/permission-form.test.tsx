// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ContactDialog } from "./contact-dialog";

afterEach(async () => { cleanup(); await new Promise<void>((resolve) => setTimeout(resolve, 0)); forgetSession(); });

function SessionControls() {
  const { state, refresh } = useSession();
  return <><span>Session: {state.status}</span><button type="button" onClick={() => void refresh()}>Refresh permissions</button></>;
}

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const close = vi.fn();
  render(<SessionProvider><SessionControls /><ApiProvider>
    <ContactDialog supplierId="s1" open onOpenChange={close} />
  </ApiProvider></SessionProvider>);
  return { backend, close };
}

function submitForm() {
  const form = screen.getByRole("dialog").querySelector("form");
  if (!form) throw new Error("Contact form not found");
  fireEvent.submit(form);
}

const writes = (backend: ReturnType<typeof stubBackend>) => backend.fetcher.mock.calls
  .filter(([input]) => input instanceof Request && input.method !== "GET");

it("blocks direct submission even if the disabled button is bypassed", async () => {
  const { backend, close } = open(["CanViewVendors"]);
  await screen.findByText("Session: authenticated");
  fireEvent.change(await screen.findByRole("textbox", { name: /Contact name/ }), { target: { value: "Ama" } });
  submitForm();
  expect((await screen.findByRole("alert")).textContent).toContain("access has changed");
  expect(writes(backend)).toEqual([]);
  expect(close).not.toHaveBeenCalled();
});

it("preserves an open draft and refuses a submit after permissions are revoked", async () => {
  const { backend, close } = open(["CanManageSupplierContracts"]);
  await screen.findByText("Session: authenticated");
  const input = await screen.findByRole("textbox", { name: /Contact name/ });
  fireEvent.change(input, { target: { value: "Unsaved contact" } });
  backend.set({ permissions: ["CanViewVendors"] });
  fireEvent.click(screen.getByText("Refresh permissions"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save contact" }).hasAttribute("disabled")).toBe(true));
  const retainedInput = screen.getByRole("textbox", { name: /Contact name/ });
  if (!(retainedInput instanceof HTMLInputElement)) throw new Error("Contact name is not an input");
  expect(retainedInput.value).toBe("Unsaved contact");
  submitForm();
  expect((await screen.findByRole("alert")).textContent).toContain("access has changed");
  expect(writes(backend)).toEqual([]);
  expect(close).not.toHaveBeenCalled();
});
