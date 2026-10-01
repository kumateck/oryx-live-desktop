// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { SessionGate } from "./session-gate";
import { SessionProvider } from "./session-provider";
import { notifySessionExpired } from "./session-events";

afterEach(() => { cleanup(); forgetSession(); });

function Workspace() {
  return <SessionProvider><MemoryRouter initialEntries={["/home?tab=tasks"]}><Routes>
    <Route path="/home" element={<SessionGate><div>Private workspace</div></SessionGate>} />
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
