// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { MaterialRetestDetailPage, MaterialRetestListPage } from "./retest-pages";
import { RetestAssignPage } from "./retest-test-pages";

vi.setConfig({ testTimeout: 30_000 });
afterEach(() => { cleanup(); forgetSession(); });

const retest = (id: string, status: number, extra: object = {}) => ({ id, materialBatchId: `batch-${id}`, batchNumber: `B-${id}`, materialKind: 0, origin: 1, status,
  approved: true, materialName: `Material ${id}`, materialCode: `RM-${id}`, events: [], ...extra });
const register = [retest("r1", 1), retest("r2", 2, { arNumber: "QCD/RM/26/900" }), retest("r3", 3, { arNumber: "QCD/RM/26/901", materialSamplingId: "s3" }), retest("r5", 5)];

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  const auth = backend.fetcher.getMockImplementation();
  const paths: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    paths.push(path);
    if (path === "/api/v1/qc/material-retests") return Response.json(register);
    const match = /^\/api\/v1\/qc\/material-retests\/(\w+)$/.exec(path);
    if (match) return Response.json(register.find((row) => row.id === match[1]));
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/qc/material-retests", element: <MaterialRetestListPage /> },
    { path: "/qc/material-retests/:id", element: <MaterialRetestDetailPage /> },
    { path: "/qc/material-retests/:id/assign", element: <RetestAssignPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { paths };
}

it("shows QA the retests awaiting a sample and QC the stages it acts on, like the analytical test request list", async () => {
  open("/qc/material-retests", ["CanViewMaterialRetests", "CanRecordMaterialRetestSample"]);
  await waitFor(() => expect(screen.queryAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Awaiting sample", "Awaiting approval", "Released or rejected"]));
  expect(await screen.findByText("Material r1")).toBeTruthy();
  expect(screen.queryByText("Material r2")).toBeNull();
  cleanup(); forgetSession();

  const user = userEvent.setup();
  open("/qc/material-retests", ["CanViewMaterialRetests", "CanAcknowledgeMaterialRetest", "CanStartRawMaterialTest"]);
  await waitFor(() => expect(screen.queryAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Sampled", "To assign", "Testing", "Awaiting approval", "Released or rejected"]));
  expect(await screen.findByText("QCD/RM/26/900")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "To assign" }));
  expect(await screen.findByText("Material r3")).toBeTruthy();
  expect(screen.queryByText("Material r2")).toBeNull();
});

it("offers each stage's next step only to the people who take it", async () => {
  const user = userEvent.setup();
  open("/qc/material-retests/r3", ["CanViewMaterialRetests", "CanViewMaterialRetestDetail", "CanStartRawMaterialTest"]);
  await user.click(await screen.findByRole("button", { name: "Next step" }));
  expect((await screen.findByRole("menuitem", { name: "Assign analysts" })).getAttribute("href")).toBe("/qc/material-retests/r3/assign");
  cleanup(); forgetSession();

  // A packaging key does not assign a raw material's test, and the acknowledging key is only for sampled retests.
  open("/qc/material-retests/r3", ["CanViewMaterialRetests", "CanViewMaterialRetestDetail", "CanStartPackagingMaterialTest", "CanAcknowledgeMaterialRetest"]);
  expect(await screen.findByText("QCD/RM/26/901")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Next step" })).toBeNull();
});

it("opens a retest's test only once QC has acknowledged its sample", async () => {
  const { paths } = open("/qc/material-retests/r2/assign", ["CanViewMaterialRetestDetail", "CanStartRawMaterialTest"]);
  expect(await screen.findByText(/Its test opens once QC acknowledges the sample/)).toBeTruthy();
  expect(paths.some((path) => path.includes("material-batch"))).toBe(false);
});
