// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { modules } from "@/modules/registry";
import { routeAccessPolicy } from "@/modules/registry-model";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { PercentageRecalculationPage } from "./components/percentage-recalculation-page";
import { percentageRecalculationKey, reasonProblem, resultsText } from "./lib/percentage-recalculation";

const listed = [
  { responseId: "r1", formFieldId: "f1", questionId: "q1", test: "Gel - Assay", product: "Blopen Gel", batch: "E001K026", arNumber: "AR QCD/BP/26/0016",
    testStatus: "TestTaken", currentResults: "[{\"key\":\"sample1\",\"unit\":\"%\",\"value\":\"1.02\"},{\"key\":\"average\",\"unit\":\"%\",\"value\":\"1.03\"}]",
    finalized: true, blocker: null },
  { responseId: "r2", formFieldId: "f1", questionId: "q1", test: "Gel - Assay", product: "Blopen Gel", batch: "E001K019", arNumber: null,
    testStatus: "Released", currentResults: "[]", finalized: true, blocker: "The test is Released; only assigned, testing or test-taken tests can be recalculated." },
];

function open(granted: string[]) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const writes: unknown[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (url.pathname !== "/api/v1/formula-repairs/percentage-recalculation") return new Response(null, { status: 404 });
    if (input.method === "GET") return Response.json(listed);
    writes.push(await input.clone().json());
    return Response.json([{ responseId: "r1", formFieldId: "f1", recalculated: true, previousResults: listed[0]?.currentResults,
      results: "[{\"key\":\"average\",\"unit\":\"%\",\"value\":\"102.85\"}]", problem: null }]);
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/", element: <PercentageRecalculationPage /> }], { initialEntries: ["/"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes };
}
afterEach(() => { cleanup(); forgetSession(); });

it("guards the page with the percentage recalculation key and no other", () => {
  const can = (keys: string[]) => {
    const policy = routeAccessPolicy(modules, "/qc/percentage-recalculation");
    return Boolean(policy && canAccess(policy.access, { state: "authenticated", permissions: new Set(keys) }));
  };
  expect(can([])).toBe(false);
  expect(can(["CanRepairTestFormula", "CanViewProductAnalyticalTestRequests"])).toBe(false);
  expect(can([percentageRecalculationKey])).toBe(true);
});

it("without the key shows no recalculate action and sends nothing", async () => {
  const backend = open([]);
  expect(await screen.findByText("E001K026")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Recalculate/ })).toBeNull();
  expect(backend.writes).toEqual([]);
});

it("recalculates the ready results with a reason and shows old and new values", async () => {
  const backend = open([percentageRecalculationKey]);
  expect(await screen.findByText("Sample 1 1.02 % · Average 1.03 %")).toBeTruthy();
  expect(screen.getByText(/only assigned, testing or test-taken/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Recalculate 1 result" }));
  fireEvent.click(await screen.findByRole("button", { name: "Recalculate" }));
  expect(await screen.findByText("Enter a reason of at least 10 characters.")).toBeTruthy();
  expect(backend.writes).toEqual([]);
  fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Assay results stored without the percentage factor." } });
  fireEvent.click(screen.getByRole("button", { name: "Recalculate" }));
  await waitFor(() => expect(backend.writes).toEqual([{ reason: "Assay results stored without the percentage factor.",
    targets: [{ responseId: "r1", formFieldId: "f1" }] }]));
  expect(await screen.findByText("1 of 1 recalculated")).toBeTruthy();
  expect(screen.getByText("Average 102.85 %")).toBeTruthy();
});

it("reads stored results and checks the reason length", () => {
  expect(resultsText("[{\"key\":\"sample2\",\"unit\":\"%\",\"value\":\"1.04\"}]")).toBe("Sample 2 1.04 %");
  expect(resultsText("not json")).toBe("not json");
  expect(resultsText(null)).toBe("–");
  expect(reasonProblem("short")).not.toBeNull();
  expect(reasonProblem("A reason long enough")).toBeNull();
});
