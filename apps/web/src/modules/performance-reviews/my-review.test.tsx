// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ReviewStatus, type Review } from "@/shared/performance/contracts";
import { employeeId, goal, review, reviewerId } from "@/shared/performance/test-fixtures";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { GoalsPage } from "../performance-goals/components/goals-page";
import { MyReviewPage } from "./components/my-review-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const open = (element: ReactNode, granted: string[], me: string | null, path = "/x") => {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state: { row: Review } = { row: { ...structuredClone(review), status: ReviewStatus.SelfAssessment, goalRatings: [], selfAssessmentSubmittedAt: null, managerSubmittedAt: null, managerComments: null, overallRating: null } };
  const calls: { path: string; search: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, search: url.search, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/employee/me") return me ? Response.json({ id: me, firstName: "Ama", lastName: "Owusu", status: 0 }) : Response.json({ errors: [{ code: "Employee.NotLinked", description: "Your account is not linked to an employee record." }] }, { status: 404 });
    if (url.pathname === "/api/v1/performance/goals") return Response.json({ data: [goal], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/performance/reviews/mine") return Response.json({ data: [state.row], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === `/api/v1/performance/reviews/${review.id}`) return Response.json(state.row);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, calls, writes: () => calls.filter((c) => c.method !== "GET") };
};
afterEach(() => { cleanup(); forgetSession(); });

it("opens a personal review to the people who submit assessments", () => {
  const can = (keys: string[]) => { const p = routeAccessPolicy(modules, `/hr/goals/reviews/${review.id}`); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can(["CanSubmitSelfAssessment"])).toBe(true);
  expect(can(["CanSubmitManagerReview"])).toBe(true);
  expect(can(["CanViewOwnGoals"])).toBe(false);
});

it("shows only the signed-in employee's goals and reviews, and says when the account is not linked", async () => {
  open(<GoalsPage />, ["CanViewOwnGoals", "CanSubmitSelfAssessment"], employeeId);
  const goals = await screen.findByRole("region", { name: "My goals" });
  expect(await within(goals).findByText(goal.title)).toBeTruthy();
  expect(await within(screen.getByRole("region", { name: "My reviews" })).findByText("Your review")).toBeTruthy();
  cleanup(); forgetSession();
  open(<GoalsPage />, ["CanViewOwnGoals"], null);
  expect(await screen.findByText(/not linked/)).toBeTruthy();
});

it("submits a self-assessment with a rating for every goal after a fresh read", async () => {
  const user = userEvent.setup();
  const app = open(<MyReviewPage />, ["CanSubmitSelfAssessment", "CanViewOwnGoals"], employeeId, `/x/${review.id}`);
  const form = await screen.findByRole("region", { name: "Your self-assessment" });
  await user.type(within(form).getByLabelText("Comments"), "A strong year.");
  await user.click(within(form).getByRole("button", { name: "Submit self-assessment" }));
  expect(within(form).getByRole("alert").textContent).toMatch(/0 to 100/);
  await user.type(within(form).getByLabelText(`Achievement for ${goal.title} (%)`), "90");
  await user.click(within(form).getByRole("button", { name: "Submit self-assessment" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: `/api/v1/performance/reviews/${review.id}/self-assessment`, body: { comments: "A strong year.", goalRatings: [{ goalId: goal.id, achievementPercentage: 90 }] } });
  expect(app.calls.some((c) => c.path === "/api/v1/performance/goals" && c.search.includes(`employeeId=${employeeId}`) && c.search.includes(`cycleId=${review.cycleId}`))).toBe(true);
});

it("does not submit a self-assessment once the review has moved on", async () => {
  const user = userEvent.setup();
  const app = open(<MyReviewPage />, ["CanSubmitSelfAssessment", "CanViewOwnGoals"], employeeId, `/x/${review.id}`);
  const form = await screen.findByRole("region", { name: "Your self-assessment" });
  await user.type(within(form).getByLabelText("Comments"), "A strong year.");
  await user.type(within(form).getByLabelText(`Achievement for ${goal.title} (%)`), "90");
  await user.click(within(form).getByRole("button", { name: "Submit self-assessment" }));
  app.state.row = { ...app.state.row, status: ReviewStatus.ManagerReview };
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Submit" }));
  // The fresh read shows the review as it now stands; nothing was sent.
  expect(await screen.findByText("Waiting for the reviewer's assessment.")).toBeTruthy();
  expect(app.writes()).toHaveLength(0);
});

it("lets only the assigned reviewer submit the manager assessment, with an overall rating", async () => {
  const user = userEvent.setup();
  const app = open(<MyReviewPage />, ["CanSubmitManagerReview"], reviewerId, `/x/${review.id}`);
  app.state.row = { ...app.state.row, status: ReviewStatus.ManagerReview, goalRatings: [{ goalId: goal.id, goalTitle: goal.title, achievementPercentage: 80, comments: null }] };
  const form = await screen.findByRole("region", { name: "Manager assessment" });
  expect((within(form).getByLabelText(`Achievement for ${goal.title} (%)`) as HTMLInputElement).value).toBe("80");
  await user.type(within(form).getByLabelText("Comments"), "Agreed.");
  await user.click(within(form).getByRole("button", { name: "Submit manager assessment" }));
  expect(within(form).getByRole("alert").textContent).toMatch(/overall rating/);
  await user.click(within(form).getByRole("combobox", { name: "Overall rating" }));
  await user.click(await screen.findByRole("option", { name: "Exceeds expectations" }));
  await user.click(within(form).getByRole("button", { name: "Submit manager assessment" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: `/api/v1/performance/reviews/${review.id}/manager-review`, body: { comments: "Agreed.", overallRating: 3, goalRatings: [{ goalId: goal.id, achievementPercentage: 80 }] } });
  cleanup(); forgetSession();
  // Someone else sees the review but no form.
  open(<MyReviewPage />, ["CanSubmitManagerReview"], employeeId, `/x/${review.id}`);
  await screen.findByText("Waiting for the employee's self-assessment.");
  expect(screen.queryByRole("region", { name: "Manager assessment" })).toBeNull();
});
