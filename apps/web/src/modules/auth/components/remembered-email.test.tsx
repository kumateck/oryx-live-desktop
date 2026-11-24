// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, stubBackend, testUserId } from "@/test/backend";
import { rememberedEmail, rememberEmail } from "../lib/remembered-email";
import { LoginScreen } from "./login-screen";

vi.mock("./auth-shell", () => ({ AuthShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
afterEach(() => { cleanup(); forgetSession(); localStorage.removeItem("oryx.login.email"); vi.restoreAllMocks(); });
function open() {
  render(<MemoryRouter initialEntries={["/login"]}><SessionProvider><Routes>
    <Route path="/login" element={<LoginScreen />} /><Route path="/home" element={<p>Workspace</p>} />
  </Routes></SessionProvider></MemoryRouter>);
}
it("stores only the opted-in email after sign-in and restores it with a blank password", async () => {
  stubBackend({ login: () => Response.json({ userId: testUserId, accessToken: "test-access", refreshToken: "test-refresh" }) });
  open(); const user = userEvent.setup();
  await user.type(await screen.findByRole("textbox", { name: /Email address/ }), "ada@example.com");
  await user.type(await screen.findByLabelText(/^Password/), "test-password");
  await user.click(screen.getByRole("checkbox", { name: /Remember my email/ }));
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Workspace")).toBeTruthy();
  expect(localStorage.getItem("oryx.login.email")).toBe("ada@example.com");
  cleanup(); forgetSession(); stubBackend(); open();
  expect((await screen.findByRole<HTMLInputElement>("textbox", { name: /Email address/ })).value).toBe("ada@example.com");
  expect((await screen.findByLabelText<HTMLInputElement>(/^Password/)).value).toBe("");
  expect(screen.getByRole("checkbox", { name: /Remember my email/ }).getAttribute("aria-checked")).toBe("true");
});
it("forgets the saved email immediately when unchecked", async () => {
  rememberEmail("ada@example.com", true); stubBackend(); open();
  await userEvent.click(await screen.findByRole("checkbox", { name: /Remember my email/ }));
  await waitFor(() => expect(rememberedEmail()).toBe(""));
  cleanup(); forgetSession(); stubBackend(); open();
  expect((await screen.findByRole<HTMLInputElement>("textbox", { name: /Email address/ })).value).toBe("");
});
it("clears a rejected password without saving it or an unverified email", async () => {
  stubBackend({ login: () => new Response(null, { status: 401 }) }); open(); const user = userEvent.setup();
  await user.type(await screen.findByRole("textbox", { name: /Email address/ }), "ada@example.com");
  await user.type(await screen.findByLabelText(/^Password/), "wrong-password");
  await user.click(screen.getByRole("checkbox", { name: /Remember my email/ }));
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect((await screen.findByLabelText<HTMLInputElement>(/^Password/)).value).toBe("");
  expect(rememberedEmail()).toBe("");
});
