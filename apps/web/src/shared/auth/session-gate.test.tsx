// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, expect, it } from "vitest";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { SessionGate } from "./session-gate";
import { SessionProvider } from "./session-provider";
import { notifySessionExpired } from "./session-events";

afterEach(() => { cleanup(); forgetSession(); });

function Address() {
  const location = useLocation();
  return <output aria-label="Current address">{location.pathname}{location.search}{location.hash}</output>;
}

function Workspace({ address = "/home?tab=tasks" }: { address?: string }) {
  return <SessionProvider><MemoryRouter initialEntries={[address]}><Address /><Routes>
    <Route path="/home" element={<SessionGate><div>Private workspace</div></SessionGate>} />
    <Route path="/production/activities/:id/final-packing" element={<SessionGate><div>Private workspace</div></SessionGate>} />
    <Route path="/login" element={<div>Sign in screen</div>} />
  </Routes></MemoryRouter></SessionProvider>;
}

it("does not display a protected route before session verification and redirects anonymous users", async () => {
  stubBackend();
  render(<Workspace />);
  expect(screen.queryByText("Private workspace")).toBeNull();
  expect(await screen.findByText("Sign in screen")).toBeTruthy();
});

it("opens a restored session", async () => {
  stubBackend();
  rememberSession();
  render(<Workspace />);
  expect(await screen.findByText("Private workspace")).toBeTruthy();
});

it("retains a deep page, its filters, and its fragment when restoring a session after reload", async () => {
  const address = "/production/activities/a1/final-packing?tab=yield#results";
  stubBackend(); rememberSession();
  render(<Workspace address={address} />);
  await screen.findByText("Private workspace");
  expect(screen.getByLabelText("Current address").textContent).toBe(address);
});

it("carries the full deep address to sign-in when the session expires", async () => {
  const address = "/production/activities/a1/final-packing?tab=yield#results";
  stubBackend(); rememberSession();
  render(<Workspace address={address} />);
  await screen.findByText("Private workspace");
  act(notifySessionExpired);
  await screen.findByText("Sign in screen");
  expect(screen.getByLabelText("Current address").textContent).toBe(`/login?next=${encodeURIComponent(address)}`);
});

it("removes protected content when an API request finds an expired session", async () => {
  stubBackend();
  rememberSession();
  render(<Workspace />);
  expect(await screen.findByText("Private workspace")).toBeTruthy();
  act(notifySessionExpired);
  expect(await screen.findByText("Sign in screen")).toBeTruthy();
});

it("shows a server outage and restores the workspace after retry", async () => {
  const backend = stubBackend({ refreshStatus: 503 });
  rememberSession();
  render(<Workspace />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  backend.set({ refreshStatus: 200 });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Private workspace")).toBeTruthy();
});
