// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import type { DecisionEvidence } from "../api/decision-evidence";
import { approvalSchema } from "../schemas/approval-schema";
import { useApprovalDecision } from "./use-approval-decision";

const entity = { id: "response", modelType: "Response", approvalLogs: [] };
const record = { form: { id: "form" }, batchManufacturingRecord: { id: "bmr" }, coaReportingToken: "reviewed-token", formResponses: [] };
const form = { sections: [] };
const evidence: DecisionEvidence = { entries: [
  { url: "/api/v1/form/responses/response", data: record }, { url: "/api/v1/form/form", data: form }, { url: "/api/v1/form/responses/bmr/bmr", data: [] },
] };
function Approval() {
  const user = useCurrentUser();
  const approval = approvalSchema.parse(entity);
  if (!approval) throw new Error("Fixture approval missing");
  const decision = useApprovalDecision(approval, "approve", evidence);
  const [message, setMessage] = useState("");
  return <><span>{user ? "Signed in" : "Loading session"}</span><button disabled={!decision.allowed || decision.busy} onClick={async () => setMessage(await decision.submit("Reviewed", null) ?? "Approved")}>Approve COA</button>
    <output aria-label="Decision result">{message}</output></>;
}
afterEach(() => { cleanup(); forgetSession(); });
it.each(["stable", "changed", "denied"] as const)("sends only reviewed COA evidence with current approval permission: %s", async mode => {
  const backend = stubBackend({ permissions: mode === "denied" ? ["CanViewPendingApprovals"] : ["CanViewPendingApprovals", "CanApproveResponse"] });
  rememberSession(); const session = backend.fetcher.getMockImplementation();
  const writes: { path: string; ifMatch: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/approval/my-pending/Response/response") return Response.json(entity);
    if (path === "/api/v1/form/responses/response") return Response.json(mode === "changed" ? { ...record, coaReportingToken: "new-settings-token" } : record);
    if (path === "/api/v1/form/form") return Response.json(form);
    if (path === "/api/v1/form/responses/bmr/bmr") return Response.json([]);
    if (path === "/api/v1/approval/approve/Response/response") { writes.push({ path, ifMatch: input.headers.get("If-Match") }); return new Response(null, { status: 204 }); }
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider><Approval /></ApiProvider></SessionProvider>);
  await screen.findByText("Signed in");
  const button = screen.getByRole("button", { name: "Approve COA" });
  if (mode === "denied") { await userEvent.click(button); expect(writes).toEqual([]); return; }
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  await userEvent.click(button);
  await waitFor(() => expect(screen.getByRole("status", { name: "Decision result" }).textContent).not.toBe(""));
  if (mode === "changed") { expect(screen.getByRole("status", { name: "Decision result" }).textContent).toContain("record changed"); expect(writes).toEqual([]); }
  else expect(writes).toEqual([{ path: "/api/v1/approval/approve/Response/response", ifMatch: '"reviewed-token"' }]);
});
