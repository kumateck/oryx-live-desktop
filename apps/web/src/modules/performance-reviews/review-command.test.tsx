// @vitest-environment jsdom
import { useState } from "react";
import { cleanup,render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach,expect,it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession,forgetSession,stubBackend,userId } from "@/test/backend";
import { review,goal,requesterId } from "@/shared/performance/test-fixtures";
import { useReviewDecision } from "./hooks/use-review-decision";
function Probe() {
 const run=useReviewDecision(review,"approve");const [error,setError]=useState("");
 return <><button onClick={() => void run("").then((e) => setError(e ?? "Done"))}>Approve</button>{error ? <p role="status">{error}</p> : null}</>;
}
function open() {
 const backend=stubBackend({ permissions:["CanApprovePerformanceReview","CanViewPerformanceReviews","CanViewTeamGoals","CanViewOwnGoals"] });
 const auth=backend.fetcher.getMockImplementation();const state={ row:structuredClone(review),goals:[structuredClone(goal)],requester:requesterId,assigned:true,writeStatus:204 };
 const writes:{ path:string;audit:string|null }[]=[];
 backend.fetcher.mockImplementation(async (input,init) => {
  if (!(input instanceof Request)) return auth ? auth(input,init) : new Response(null,{ status:500 });
  const path=new URL(input.url).pathname;
  if (input.method === "POST") { writes.push({ path,audit:input.headers.get("Module") });return new Response(null,{ status:state.writeStatus }); }
  if (path.includes("/approval/my-pending/")) return state.assigned ? Response.json({ id:review.id,modelType:"PerformanceReview",requestedBy:{ id:state.requester } }) : new Response(null,{ status:403 });
  if (path.endsWith("/goals")) return Response.json({ data:state.goals,pageIndex:1,pageCount:1,totalRecordCount:state.goals.length });
  if (path.endsWith(review.id)) return Response.json(state.row);
  return new Response(null,{ status:404 });
 });
 rememberSession();render(<SessionProvider><ApiProvider><Probe /></ApiProvider></SessionProvider>);return { state,writes };
}
afterEach(() => { cleanup();forgetSession(); });
const approve=async () => { await waitFor(() => expect(screen.getByRole("button")).toBeTruthy());await userEvent.setup().click(screen.getByRole("button"));await screen.findByRole("status"); };
it("approves with current assessments, complete goals, an assigned stage and audit headers",async () => {
 const page=open();await approve();await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Done"));
 expect(page.writes).toEqual([{ path:`/api/v1/approval/approve/PerformanceReview/${review.id}`,audit:"HR Management" }]);
});
it.each(["stale","missing-goals","self","unassigned"] as const)("refuses approval when %s",async (kind) => {
 const page=open();if (kind === "stale") page.state.row={ ...review,managerComments:"Changed" };
 if (kind === "missing-goals") page.state.goals=[];if (kind === "self") page.state.requester=userId;if (kind === "unassigned") page.state.assigned=false;
 await approve();expect(page.writes).toHaveLength(0);expect(screen.getByRole("status").textContent).not.toBe("Done");
});
it("does not replay a refused approval",async () => { const page=open();page.state.writeStatus=409;await approve();expect(page.writes).toHaveLength(1);expect(screen.getByRole("status").textContent).not.toBe("Done"); });
