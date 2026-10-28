// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { deliveredMaterialSchema, type DeliveredMaterial } from "../schemas/receiving-schema";
import { CreateGrnDialog } from "./create-grn-dialog";

vi.setConfig({ testTimeout: 30_000 });
afterEach(() => { cleanup(); forgetSession(); });
const number = () => screen.getByRole("textbox", { name: /GRN number/ }) as HTMLInputElement;

function AuthenticatedDialog({ kind, material }: { kind: MaterialKind; material: DeliveredMaterial }) {
  const user = useCurrentUser();
  return user ? <ApiProvider><CreateGrnDialog kind={kind} materials={[material]} onClose={() => {}} onDone={() => {}} /></ApiProvider> : null;
}

function open({ kind = 0, beta = false, counts = [7], failAt = 0 }: {
  kind?: MaterialKind; beta?: boolean; counts?: (number | null)[]; failAt?: number;
} = {}) {
  const backend = stubBackend({ permissions: [kind === 0 ? "CanCreateGrnForRawMaterials" : "CanCreateGrnForPackagingMaterials"] });
  const auth = backend.fetcher.getMockImplementation();
  const calls: { path: string; body: string; prefix: string | null; module: string | null; subModule: string | null }[] = [];
  let reads = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, body: await input.clone().text(), prefix: url.searchParams.get("prefix"),
      module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
    if (url.pathname === "/api/v1/configuration/GrnNumber/count") {
      reads++;
      return reads === failAt ? new Response(null, { status: 503 })
        : Response.json(counts[Math.min(reads - 1, counts.length - 1)] ?? null);
    }
    if (url.pathname === "/api/v1/warehouse/distributed-material/material-batch") return Response.json([{ id: "batch-1" }]);
    if (url.pathname === "/api/v1/warehouse/grn") return Response.json("grn-1");
    return new Response(null, { status: 404 });
  });
  const material = deliveredMaterialSchema.parse({ id: "dm-1", status: 2, quantity: 100,
    material: { id: "material-1", name: "Material", kind }, department: { isBeta: beta },
    checklists: [{ materialBatches: [{ id: "batch-1" }] }] });
  if (!material) throw new Error("Invalid test material");
  rememberSession();
  render(<SessionProvider><AuthenticatedDialog kind={kind} material={material} /></SessionProvider>);
  return calls;
}

async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: /Carrier's name/ }), "Carrier");
  await user.type(screen.getByRole("textbox", { name: /Vehicle number/ }), "GT-1");
  await user.click(screen.getByRole("button", { name: "Create GRN" }));
}

it("automatically previews a read-only number and issues with a freshly read count and audit headers", async () => {
  const calls = open({ counts: [7, 8] });
  const year = String(new Date().getFullYear()).slice(-2);
  await waitFor(() => expect(number().value).toBe(`WHD/RM/${year}/008`));
  expect(number().readOnly).toBe(true);
  await fill();
  await waitFor(() => expect(calls.filter(call => call.path === "/api/v1/warehouse/grn")).toHaveLength(1));
  expect(number().value).toBe(`WHD/RM/${year}/009`);
  expect(calls.find(call => call.path === "/api/v1/warehouse/grn")?.body).toContain(`"grnNumber":"WHD/RM/${year}/009"`);
  const reads = calls.filter(call => call.path === "/api/v1/configuration/GrnNumber/count");
  expect(reads).toHaveLength(2);
  expect(reads[0]).toMatchObject({ prefix: `WHD/RM/${year}`, module: "Warehouse", subModule: "Receiving Area" });
});

it.each([{ kind: 0 as const, beta: true, prefix: "BWH/RM" },
  { kind: 1 as const, beta: false, prefix: "WHD/PM" }, { kind: 1 as const, beta: true, prefix: "BWH/PM" }])(
  "uses the $prefix series and keeps serials longer than three digits", async ({ kind, beta, prefix }) => {
    open({ kind, beta, counts: [999] });
    await waitFor(() => expect(number().value).toBe(`${prefix}/${String(new Date().getFullYear()).slice(-2)}/1000`));
  });

it("shows an initial count failure and retries without allowing a manual number", async () => {
  open({ failAt: 1 });
  await screen.findByRole("alert");
  expect(number().value).toBe("");
  expect((screen.getByRole("button", { name: "Create GRN" }) as HTMLButtonElement).disabled).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Retry number generation" }));
  await waitFor(() => expect(number().value).toMatch(/\/008$/));
});

it("does not create a note with a stale preview when the issue-time count fails", async () => {
  const calls = open({ failAt: 2 });
  await waitFor(() => expect(number().value).toMatch(/\/008$/));
  await fill();
  await screen.findByRole("alert");
  expect(calls.filter(call => call.path === "/api/v1/warehouse/grn")).toHaveLength(0);
});

it.each([null, -1, 1.5, Number.MAX_SAFE_INTEGER])("blocks an invalid count (%s) instead of inventing a number", async count => {
  open({ counts: [count] });
  await screen.findByRole("alert");
  expect(number().value).toBe("");
  expect((screen.getByRole("button", { name: "Create GRN" }) as HTMLButtonElement).disabled).toBe(true);
});
