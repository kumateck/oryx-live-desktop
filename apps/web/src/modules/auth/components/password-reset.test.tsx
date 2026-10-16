// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import ForgotPasswordPage from "../../../pages/(public)/forgot-password/page";
import LoginPage from "../../../pages/(public)/login/page";
import ResetPasswordPage from "../../../pages/(public)/reset-password/page";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { ThemeProvider } from "../../../shared/theme/theme-provider";
import { forgetSession } from "../../../test/backend";
import { resetKey, resetPasswordSchema } from "../schemas/password-reset-schema";

afterEach(() => { cleanup(); forgetSession(); });
// The theme follows the system colour scheme, which jsdom does not report.
window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as typeof window.matchMedia;
const key = "6f9619ff-8b86-4011-b42d-00c04fc964ff";

function open(address: string, answer: (path: string, body: unknown) => Response) {
  const calls: { path: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input).split("?")[0] ?? "";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as unknown : null;
    if (path.startsWith("/api/v1/auth/forgot") || path.startsWith("/api/v1/auth/set")) calls.push({ path, body });
    // No stored session: the refresh exchange is refused, so the signed-out pages show.
    return path.startsWith("/api/v1/auth/login") ? new Response(null, { status: 401 }) : answer(path, body);
  }));
  const router = createMemoryRouter([{ path: "/login", element: <LoginPage /> }, { path: "/forgot-password", element: <ForgotPasswordPage /> }, { path: "/reset-password", element: <ResetPasswordPage /> }], { initialEntries: [address] });
  render(<ThemeProvider><SessionProvider><RouterProvider router={router} /></SessionProvider></ThemeProvider>);
  return { calls, router };
}

it("accepts a reset key or the whole emailed link, and holds new passwords to the server's rules", () => {
  expect([resetKey(key), resetKey(`https://erp.example/reset-password?key=${key}`), resetKey(` http://10.0.0.5/reset-password?key=${key.toUpperCase()} `), resetKey("hello"), resetKey(null)])
    .toEqual([key, key, key.toUpperCase(), null, null]);
  const issues = (password: string, confirmPassword = password) => resetPasswordSchema.safeParse({ password, confirmPassword }).error?.issues.map((issue) => issue.message) ?? [];
  expect(issues("Str0ng!pass")).toEqual([]);
  expect(issues("weak")).toEqual(["Use at least 8 characters", "Include a digit", "Include a capital letter", "Include a symbol, such as ! or #"]);
  expect(issues("Str0ng!pass", "Str0ng!pas")).toEqual(["Passwords do not match"]);
});

it("links from sign-in to a reset request, and says the same whether or not the address has an account", async () => {
  const user = userEvent.setup();
  const { calls } = open("/login", () => Response.json({ errors: [{ code: "Users.NotFound", description: "The user with the email: x was not found" }] }, { status: 404 }));
  await user.click(await screen.findByRole("link", { name: "Forgot your password?" }));
  await user.type(await screen.findByRole("textbox", { name: /Email address/ }), "nobody@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));
  expect(await screen.findByText(/If an account uses/)).toBeTruthy();
  expect(screen.queryByText(/was not found/)).toBeNull();
  expect(calls).toEqual([{ path: "/api/v1/auth/forgot-password", body: { email: "nobody@example.com" } }]);
});

it("sets the new password with the key from the address, and treats a 200 without success as a refusal", async () => {
  const user = userEvent.setup();
  let refuse = true;
  const { calls } = open(`/reset-password?key=${key}`, () => Response.json(refuse ? { success: false, errors: ["Passwords must be different from the last one."] } : { success: true }));
  await user.type(await screen.findByLabelText(/^New password/), "Str0ng!pass");
  await user.type(screen.getByLabelText(/Confirm the new password/), "Str0ng!pass");
  await user.click(screen.getByRole("button", { name: "Set new password" }));
  expect(await screen.findByText(/must be different/)).toBeTruthy();
  refuse = false;
  await user.type(screen.getByLabelText(/^New password/), "Str0nger!pass");
  await user.type(screen.getByLabelText(/Confirm the new password/), "Str0nger!pass");
  await user.click(screen.getByRole("button", { name: "Set new password" }));
  expect(await screen.findByRole("heading", { name: "Password changed" })).toBeTruthy();
  expect(calls.at(-1)).toEqual({ path: "/api/v1/auth/set-password", body: { token: key, password: "Str0nger!pass", confirmPassword: "Str0nger!pass" } });
});

it("asks for the emailed link when the address has no key, and explains an expired one", async () => {
  const user = userEvent.setup();
  open("/reset-password", () => Response.json({ errors: [{ code: "Token.Expired", description: "expired" }] }, { status: 404 }));
  await user.type(await screen.findByRole("textbox", { name: "Link from the email" }), "not a link");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(await screen.findByText(/not a reset link/)).toBeTruthy();
  await user.clear(screen.getByRole("textbox", { name: "Link from the email" }));
  await user.type(screen.getByRole("textbox", { name: "Link from the email" }), `https://erp.example/reset-password?key=${key}`);
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.type(await screen.findByLabelText(/^New password/), "Str0ng!pass");
  await user.type(screen.getByLabelText(/Confirm the new password/), "Str0ng!pass");
  await user.click(screen.getByRole("button", { name: "Set new password" }));
  await waitFor(() => expect(screen.getByText(/has expired; links last two days/)).toBeTruthy());
});
