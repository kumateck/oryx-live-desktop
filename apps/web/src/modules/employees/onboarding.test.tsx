// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { OnboardingPage } from "./components/onboarding-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

type Answer = (body: Record<string, unknown>) => Response;
function open(path: string, answers: Record<string, Answer>) {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as Record<string, unknown> : {};
    calls.push({ path: input, body });
    if (input === "/api/v1/countries") return Response.json([{ id: "gh", name: "Ghana" }]);
    const answer = answers[input];
    return answer ? answer(body) : new Response(null, { status: 404 });
  }));
  const router = createMemoryRouter([{ path: "/onboarding/:type", element: <OnboardingPage /> }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return calls;
}
const invitation = () => Response.json({ email: "kofi@example.com", name: "Kofi Mensah", employeeType: 1, expiresAt: "2026-10-30T00:00:00Z" });
const refused = (code: string, description: string, status = 400) => () => Response.json({ errors: [{ code, description }] }, { status });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("explains a used or expired invitation instead of showing the form", async () => {
  open("/onboarding/1?token=abc", { "/api/v1/onboarding/invitation": refused("Onboarding.Used", "This invitation has already been used.") });
  expect((await screen.findByRole("alert")).textContent).toBe("This invitation has already been used.");
  expect(screen.queryByRole("button", { name: "Send my details" })).toBeNull();
});

it("refuses a link whose employee type was edited", async () => {
  open("/onboarding/0?token=abc", { "/api/v1/onboarding/invitation": invitation });
  expect((await screen.findByRole("alert")).textContent).toMatch(/link has been changed/);
});

it("sends the form once with the invitation's email and no staff number", async () => {
  const user = userEvent.setup();
  const calls = open("/onboarding/1?token=abc", {
    "/api/v1/onboarding/invitation": invitation,
    "/api/v1/onboarding/submit": () => Response.json("e1"),
  });
  const email = await screen.findByLabelText(/^Email/);
  expect((email as HTMLInputElement).value).toBe("kofi@example.com");
  expect((email as HTMLInputElement).disabled).toBe(true);
  expect(screen.queryByLabelText(/^Staff number/)).toBeNull();
  // Field controls load lazily; wait for each before using it.
  expect(((await screen.findByLabelText(/^First name/)) as HTMLInputElement).value).toBe("Kofi");
  await user.click(await screen.findByRole("combobox", { name: /^Gender/ }));
  await user.click(await screen.findByRole("option", { name: "Male" }));
  await user.click(screen.getByRole("button", { name: "Send my details" }));
  expect(await screen.findByText(/sent to HR/)).toBeTruthy();
  const submits = calls.filter((c) => c.path === "/api/v1/onboarding/submit");
  expect(submits).toHaveLength(1);
  expect(submits[0]?.body).toMatchObject({ token: "abc", employee: { firstName: "Kofi", lastName: "Mensah", email: "kofi@example.com", type: 1, gender: 0, staffNumber: null } });
});

it("keeps the sent form when the server refuses it and says why", async () => {
  const user = userEvent.setup();
  open("/onboarding/1?token=abc", {
    "/api/v1/onboarding/invitation": invitation,
    "/api/v1/onboarding/submit": refused("Employee.Phone", "Enter a valid phone number."),
  });
  await user.click(await screen.findByRole("combobox", { name: /^Gender/ }));
  await user.click(await screen.findByRole("option", { name: "Female" }));
  await user.click(screen.getByRole("button", { name: "Send my details" }));
  await waitFor(() => expect(screen.getByText("Enter a valid phone number.")).toBeTruthy());
  expect(screen.getByRole("button", { name: "Send my details" })).toBeTruthy();
});
