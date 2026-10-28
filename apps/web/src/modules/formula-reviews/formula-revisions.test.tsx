// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { buildFormulaRevisionDraft, type FormulaRevisionDraft } from "@/shared/formula/builder/definition-adapter";
import { checkRevisionEvidence } from "@/shared/formula/review/revision-evidence";
import { decisionProblem, sameDecisionEvidence, selectRevision } from "@/shared/formula/review/revision-review";
import { formulaRevisionSchema, type FormulaRevision } from "@/shared/formula/governance-api";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { FormulaRevisionDetailPage } from "./components/formula-revision-detail";
import { FormulaRevisionQueuePage } from "./components/formula-revision-queue";

const reviewer = ["CanViewReviewFormulaRevision", "CanReviewFormulaRevision"];
const approver = ["CanViewApproveFormulaRevision", "CanApproveFormulaRevision"];
const author = "a0000000-0000-4000-8000-000000000001";
const otherReviewer = "b0000000-0000-4000-8000-000000000002";
let draft: FormulaRevisionDraft;
beforeAll(async () => { draft = await buildFormulaRevisionDraft(":weight * 2", "Simple"); });

const revision = (overrides: Partial<FormulaRevision> = {}) => ({
  id: "r2", formulaDefinitionId: "d1", questionId: "q1", revision: 2, definitionHash: draft.definitionHash, formulaLanguageVersion: draft.formulaLanguageVersion,
  numericPolicyVersion: draft.numericPolicyVersion, presentationPreset: draft.presentationPreset, authoringPayload: null, status: 1, statusName: "InReview",
  definition: draft.definition, testCases: draft.testCases, createdById: author, reviewedById: null, reviewedAt: null, approvedById: null, approvedAt: null, effectiveAt: null, ...overrides,
});
const queueItem = (record: ReturnType<typeof revision>) => ({ revisionId: record.id, questionId: record.questionId, questionLabel: "Assay", questionReference: "STP-12", revision: record.revision,
  definitionHash: record.definitionHash, status: record.status, statusName: record.statusName, createdById: record.createdById, reviewedById: record.reviewedById, reviewedAt: record.reviewedAt, createdAt: "2026-10-20T10:00:00Z" });

function open(address: string, granted: string[], initial = revision()) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { record: initial, fail: false };
  const calls: { path: string; method: string; module: string | null; subModule: string | null; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const body: unknown = input.method === "GET" ? null : await input.clone().json().catch(() => null);
    calls.push({ path: url.pathname, method: input.method, module: input.headers.get("Module"), subModule: input.headers.get("SubModule"), body });
    const base = "/api/v1/formula-definitions";
    if (input.method === "POST") {
      if (state.fail) return Response.json({ errors: [{ code: "FormulaDefinition.Conflict", description: "The revision changed." }] }, { status: 409 });
      return Response.json(url.pathname.endsWith("/approve") ? { ...state.record, status: 2, statusName: "Approved", approvedById: testUserId } : { ...state.record, reviewedById: testUserId });
    }
    if (url.pathname === `${base}/review-queue`) return Response.json(state.record.reviewedById ? [] : [queueItem(state.record)]);
    if (url.pathname === `${base}/approval-queue`) return Response.json(state.record.reviewedById ? [queueItem(state.record)] : []);
    if (url.pathname === `${base}/questions/q1/review-revisions` || url.pathname === `${base}/questions/q1/approval-revisions`)
      return Response.json([state.record, revision({ id: "r1", revision: 1, status: 2, statusName: "Approved", reviewedById: otherReviewer, approvedById: otherReviewer })]);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/qa/formula-reviews", element: <FormulaRevisionQueuePage stage="review" /> },
    { path: "/qa/formula-reviews/:questionId", element: <FormulaRevisionDetailPage stage="review" /> },
    { path: "/qa/formula-approvals", element: <FormulaRevisionQueuePage stage="approval" /> },
    { path: "/qa/formula-approvals/:questionId", element: <FormulaRevisionDetailPage stage="approval" /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, calls, router, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); });

describe("formula reviewer access", () => {
  const context = (permissions: string[]) => ({ state: "authenticated" as const, permissions: new Set(permissions) });
  it("opens the review and approval pages without any question permission", () => {
    for (const path of ["/qa/formula-reviews", "/qa/formula-reviews/q1"]) {
      const rule = routeAccessPolicy(modules, path)?.access;
      expect(rule && canAccess(rule, context(reviewer))).toBe(true);
      expect(rule && canAccess(rule, context(approver))).toBe(false);
    }
    for (const path of ["/qa/formula-approvals", "/qa/formula-approvals/q1"]) {
      const rule = routeAccessPolicy(modules, path)?.access;
      expect(rule && canAccess(rule, context(approver))).toBe(true);
      expect(rule && canAccess(rule, context(reviewer))).toBe(false);
    }
    // The editor stays the author's page.
    const editor = routeAccessPolicy(modules, "/settings/questions/formula/q1/edit")?.access;
    expect(editor && canAccess(editor, context([...reviewer, ...approver]))).toBe(false);
  });

  it("applies the server's separation of duties and stage rules", () => {
    const record = formulaRevisionSchema.parse(revision());
    expect(decisionProblem(record, "review", author)).toContain("You wrote");
    expect(decisionProblem(record, "review", testUserId)).toBeNull();
    expect(decisionProblem(record, "approval", testUserId)).toContain("not been reviewed");
    const reviewed = formulaRevisionSchema.parse(revision({ reviewedById: testUserId }));
    expect(decisionProblem(reviewed, "approval", testUserId)).toContain("You reviewed");
    expect(decisionProblem(reviewed, "approval", author.toUpperCase())).toContain("You wrote");
    expect(decisionProblem(reviewed, "review", otherReviewer)).toContain("already been reviewed");
    expect(decisionProblem(formulaRevisionSchema.parse(revision({ status: 2 })), "approval", testUserId)).toContain("not waiting");
    expect(sameDecisionEvidence(record, { ...record, definitionHash: "f".repeat(64) })).toBe(false);
    expect(selectRevision([record], "gone", "review")).toEqual({ revision: null, missing: true });
  });

  it("recomputes the definition hash and flags a definition that does not match it", async () => {
    const good = await checkRevisionEvidence(revision());
    expect(good).toMatchObject({ state: "checked", hashMatches: true });
    expect(good.state === "checked" && good.outcomes.every((outcome) => outcome.passed)).toBe(true);
    const altered = { ...draft.definition, results: draft.definition.results.map((result) => ({ ...result, expression: ":weight * 3" })) };
    expect(await checkRevisionEvidence(revision({ definition: altered }))).toMatchObject({ state: "checked", hashMatches: false });
    expect((await checkRevisionEvidence(revision({ definition: { nonsense: true } }))).state).toBe("unreadable");
  });
});

describe("formula review pages", () => {
  it("lists the queue and opens the exact revision", async () => {
    const user = userEvent.setup(); const page = open("/qa/formula-reviews", reviewer);
    await user.click(await screen.findByText("Assay"));
    await waitFor(() => expect(page.router.state.location.search).toBe("?revisionId=r2"));
    expect(await screen.findByText("The definition shown reproduces the hash it was submitted under.")).toBeTruthy();
    expect(page.calls.some((call) => call.path.endsWith("/questions/q1/revisions"))).toBe(false);
  });

  it("records a confirmed review with the exact hash, reason and audit headers", async () => {
    const user = userEvent.setup(); const page = open("/qa/formula-reviews/q1?revisionId=r2", reviewer);
    await user.type(await screen.findByLabelText(/Review findings/), "Checked the assay calculation against the STP.");
    await user.click(screen.getByRole("button", { name: "Record review" }));
    expect(page.writes()).toHaveLength(0);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Record review" }));
    await waitFor(() => expect(page.writes()).toHaveLength(1));
    expect(page.writes()[0]).toMatchObject({ path: "/api/v1/formula-definitions/revisions/r2/record-review", module: "QualityAssurance", subModule: "Formula",
      body: { expectedDefinitionHash: draft.definitionHash, reason: "Checked the assay calculation against the STP." } });
    await waitFor(() => expect(page.router.state.location.pathname).toBe("/qa/formula-reviews"));
  });

  it("sends nothing when the revision changed after it was opened", async () => {
    const user = userEvent.setup(); const page = open("/qa/formula-reviews/q1?revisionId=r2", reviewer);
    await user.type(await screen.findByLabelText(/Review findings/), "Checked the assay calculation against the STP.");
    await user.click(screen.getByRole("button", { name: "Record review" }));
    page.state.record = revision({ reviewedById: otherReviewer });
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Record review" }));
    // The fresh read replaces what the page shows, so the decision gives way to the revision's new standing.
    expect(await screen.findByText("This revision has already been reviewed. It is waiting for approval.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record review" })).toBeNull();
    expect(page.writes()).toHaveLength(0);
  });

  it("refuses a decision when the definition hash changed under the open dialog", async () => {
    const user = userEvent.setup(); const page = open("/qa/formula-reviews/q1?revisionId=r2", reviewer);
    await user.type(await screen.findByLabelText(/Review findings/), "Checked the assay calculation against the STP.");
    await user.click(screen.getByRole("button", { name: "Record review" }));
    page.state.record = revision({ definitionHash: "f".repeat(64) });
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Record review" }));
    expect(await within(screen.getByRole("dialog")).findByText(/changed after you opened it/)).toBeTruthy();
    expect(page.writes()).toHaveLength(0);
  });

  it("tells the author they cannot review their own revision", async () => {
    open("/qa/formula-reviews/q1", reviewer, revision({ createdById: testUserId }));
    expect(await screen.findByText("You wrote this revision. Someone else must review it.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record review" })).toBeNull();
  });

  it("shows the revision read-only to someone who may view but not decide", async () => {
    open("/qa/formula-reviews/q1", ["CanViewReviewFormulaRevision"]);
    expect(await screen.findByText(/cannot record its review/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record review" })).toBeNull();
  });

  it("approves a reviewed revision and keeps the dialog open with the server's refusal", async () => {
    const user = userEvent.setup(); const page = open("/qa/formula-approvals/q1?revisionId=r2", approver, revision({ reviewedById: otherReviewer, reviewedAt: "2026-10-21T09:00:00Z" }));
    page.state.fail = true;
    await user.type(await screen.findByLabelText(/Reason for approval/), "Review complete and checks pass; release for use.");
    await user.click(screen.getByRole("button", { name: "Approve revision" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve revision" }));
    await waitFor(() => expect(page.writes()).toHaveLength(1));
    expect(page.writes()[0]?.path).toBe("/api/v1/formula-definitions/revisions/r2/approve");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("reports a named revision that is gone instead of showing another one", async () => {
    open("/qa/formula-reviews/q1?revisionId=r9", reviewer);
    expect(await screen.findByText(/no longer available/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record review" })).toBeNull();
  });
});
