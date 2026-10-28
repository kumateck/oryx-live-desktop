// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { approvalSchema } from "../schemas/approval-schema";
import { DecisionDialog } from "./decision-dialog";
import { entity } from "./__fixtures__/approval-records";
const queued = entity("Response", "response-1");
const approval = approvalSchema.parse(queued);
const response = { id: "response-1", form: { id: "form-1" }, materialBatch: { id: "batch-1" } };
const form = { id: "form-1", sections: [] };
const evidence = { entries: [{ url: "/api/v1/form/responses/response-1", data: response }, { url: "/api/v1/form/form-1", data: form }, { url: "/api/v1/form/responses/material-batch/batch-1", data: [] }] };
afterEach(() => { cleanup(); forgetSession(); });
function Dialog({ done }: { done: () => void }) {
  const user = useCurrentUser();
  return user && approval ? <DecisionDialog approval={approval} decision="reject" evidence={evidence} onClose={() => {}} onDone={done} /> : null;
}
it.each([["Rework testing", 1], ["Dispose", 0]] as const)("requires an explicit %s disposition and sends the backend enum", async (choice, outcome) => {
  const backend = stubBackend({ permissions: ["CanRejectResponse", "CanViewPendingApprovals"] });
  const auth = backend.fetcher.getMockImplementation();
  const bodies: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/approval/my-pending/Response/response-1") return Response.json(queued);
    if (path === "/api/v1/form/responses/response-1") return Response.json(response);
    if (path === "/api/v1/form/form-1") return Response.json(form);
    if (path === "/api/v1/form/responses/material-batch/batch-1") return Response.json([]);
    if (path === "/api/v1/approval/reject/Response/response-1") { bodies.push(await input.text()); return new Response(null, { status: 204 }); }
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const done = vi.fn();
  render(<SessionProvider><ApiProvider><Dialog done={done} /></ApiProvider></SessionProvider>);
  const user = userEvent.setup();
  await user.type(await screen.findByRole("textbox", { name: /Reason for rejecting/ }), "Assay failed specification");
  await screen.findByRole("radio", { name: choice });
  await user.click(screen.getByRole("button", { name: "Reject request" }));
  expect(await screen.findByText("Choose rework testing or disposal")).toBeTruthy();
  expect(bodies).toEqual([]);
  await user.click(screen.getByRole("radio", { name: choice }));
  await user.click(screen.getByRole("button", { name: "Reject request" }));
  await waitFor(() => expect(done).toHaveBeenCalledOnce());
  expect(bodies.map((body) => JSON.parse(body))).toEqual([{ comments: "Assay failed specification", responseRejectionOutcome: outcome }]);
});
