// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { retestPermissions, retestSchema } from "../schemas/retest";
import { RetestActionDialog, type RetestAction } from "./retest-action";
vi.setConfig({ testTimeout: 30_000 });
afterEach(() => { cleanup(); forgetSession(); });
const initial = { id: "retest-1", materialBatchId: "batch-1", batchNumber: "B-1", materialKind: 0, origin: 1, status: 2, approved: true, events: [] };
function open(action: RetestAction, { changed = false, assigned = true }: { changed?: boolean; assigned?: boolean } = {}) {
  const source = { ...initial, status: action === "approve" ? 0 : 2 };
  const record = retestSchema.parse(source);
  const backend = stubBackend({ permissions: [retestPermissions[action], retestPermissions.detail] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: { path: string; body: string }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") { writes.push({ path, body: await input.text() }); return new Response(null, { status: 204 }); }
    if (path === "/api/v1/qc/material-retests/retest-1") return Response.json(changed ? { ...source, status: 3 } : source);
    if (path === "/api/v1/qc/worksheets/approvals/my-pending") return Response.json(assigned ? [{ entityType: "MaterialRetest", entityId: record.id }] : []);
    return new Response(null, { status: 404 });
  });
  const done = vi.fn();
  function Dialog() { const user = useCurrentUser(); return user ? <RetestActionDialog record={record} action={action} onClose={() => {}} onDone={done} /> : null; }
  rememberSession();
  render(<SessionProvider><ApiProvider><Dialog /></ApiProvider></SessionProvider>);
  return { done, writes };
}
it("acknowledges only the verified sample using the governed endpoint", async () => {
  const { writes, done } = open("acknowledge");
  await userEvent.click(await screen.findByRole("button", { name: "Acknowledge sample" }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(writes).toEqual([{ path: "/api/v1/qc/material-retests/retest-1/acknowledge", body: "" }]);
});
it("refuses a retest whose state changed while confirmation was open", async () => {
  const { writes } = open("acknowledge", { changed: true });
  await userEvent.click(await screen.findByRole("button", { name: "Acknowledge sample" }));
  expect(await screen.findByText(/This record changed/)).toBeTruthy();
  expect(writes).toEqual([]);
});
it.each([true, false])("checks the assigned approval stage before signing (assigned: %s)", async (assigned) => {
  const { writes, done } = open("approve", { assigned });
  const password = await screen.findByLabelText("Your password", { exact: false, selector: "input" });
  const reason = await screen.findByRole("textbox", { name: /Decision reason/ });
  await userEvent.type(password, "fixture-password");
  expect(password).toHaveProperty("value", "fixture-password");
  await userEvent.type(reason, "Authorize sample collection");
  expect(password).toHaveProperty("value", "fixture-password");
  await userEvent.click(screen.getByRole("button", { name: "Sign approval" }));
  if (!assigned) { expect(await screen.findByText(/no longer assigned to you/)).toBeTruthy(); expect(writes).toEqual([]); }
  else {
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(writes.map((entry) => ({ path: entry.path, body: JSON.parse(entry.body) }))).toEqual([{ path: "/api/v1/qc/material-retests/retest-1/approve", body: { password: "fixture-password", comments: "Authorize sample collection" } }]);
  }
});
