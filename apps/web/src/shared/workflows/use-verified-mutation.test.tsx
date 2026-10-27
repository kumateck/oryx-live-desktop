// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { SessionProvider } from "../auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { useVerifiedMutation } from "./use-verified-mutation";
import { useSession } from "../auth/session-provider";

afterEach(() => { cleanup(); forgetSession(); });
function Harness({ read, write }: { read: () => Promise<{ version: number }>; write: () => Promise<void> }) {
  const command = useVerifiedMutation<{ version: number }>("CanApproveResponse");
  const [message, setMessage] = useState("");
  const session = useSession();
  return <><button onClick={() => void command.run({ version: 1 }, read, write).then((failure) => setMessage(failure ?? "Saved"))}>Confirm</button>
    <button onClick={() => void session.refresh().then(() => setMessage("Access refreshed"))}>Refresh access</button><p role="status">{message}</p></>;
}
function open(read: () => Promise<{ version: number }>, write: () => Promise<void>, permissions = ["CanApproveResponse"]) {
  const backend = stubBackend({ permissions }); rememberSession();
  render(<SessionProvider><Harness read={read} write={write} /></SessionProvider>);
  return backend;
}
it("refuses stale evidence before sending a mutation", async () => {
  const write = vi.fn(async () => {});
  open(async () => ({ version: 2 }), write);
  await screen.findByRole("button", { name: "Confirm" });
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(await screen.findByText(/This record changed/)).toBeTruthy(); expect(write).not.toHaveBeenCalled();
});
it("a sent request cannot be replayed from the same confirmation after an uncertain failure", async () => {
  const write = vi.fn(async () => { throw new Error("Connection lost"); });
  open(async () => ({ version: 1 }), write);
  await userEvent.click(await screen.findByRole("button", { name: "Confirm" }));
  expect(await screen.findByText("Connection lost")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(await screen.findByText(/The request was sent/)).toBeTruthy(); expect(write).toHaveBeenCalledTimes(1);
});
it("rechecks permission after asynchronous evidence work", async () => {
  const write = vi.fn(async () => {});
  let resolve: ((value: { version: number }) => void) | undefined;
  const pending = new Promise<{ version: number }>((done) => { resolve = done; });
  const backend = open(() => pending, write);
  await userEvent.click(await screen.findByRole("button", { name: "Confirm" }));
  // A 403 access refresh comes from the session boundary, while the confirmation remains open.
  backend.set({ permissions: [] });
  await userEvent.click(screen.getByRole("button", { name: "Refresh access" }));
  await screen.findByText("Access refreshed");
  await act(async () => { resolve?.({ version: 1 }); });
  expect(write).not.toHaveBeenCalled();
});
