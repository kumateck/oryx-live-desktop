// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { testCorrectionAccess, type TestCorrectionKind } from "./test-correction-access";
import { TestCorrectionPanel } from "./test-correction-panel";
afterEach(async () => { cleanup(); forgetSession(); await new Promise(resolve => setTimeout(resolve, 25)); vi.unstubAllGlobals(); });
function open(kind: TestCorrectionKind, permissions: string[], status = 200) {
  const backend = stubBackend({ permissions }); rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: { url: string; body: string }[] = []; const done = vi.fn();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (input.method === "POST") {
      writes.push({ url: input.url, body: await input.text() });
      return status === 200 ? Response.json("new-response") : Response.json({ errors: [{ code: "TestCorrection.State", description: "The certificate has already been generated. Reload." }] }, { status });
    }
    return Response.json({ responseId: "response", canReturn: true, history: [{ id: "return-1", returnedBy: "Ama QC", returnedAt: "2026-11-18T10:00:00Z", reason: "Verify the dilution and sample weight." }] });
  });
  render(<SessionProvider><ApiProvider><TestCorrectionPanel responseId="response" kind={kind} canReturn onReturned={done} /></ApiProvider></SessionProvider>);
  return { writes, done };
}
for (const kind of ["product", "raw", "packaging"] as const) {
  it(`requires a reason and sends the ${kind} return to the matching endpoint`, async () => {
    const { writes, done } = open(kind, Object.values(testCorrectionAccess[kind]));
    await screen.findByText("Verify the dilution and sample weight.");
    fireEvent.click(screen.getByRole("button", { name: "Return to under test" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(dialog.getByRole("button", { name: "Return to under test" }));
    await dialog.findByRole("alert"); expect(writes).toHaveLength(0);
    fireEvent.change(dialog.getByRole("textbox", { name: "Reason for correction" }), { target: { value: " Correct the dilution " } });
    fireEvent.click(dialog.getByRole("button", { name: "Return to under test" }));
    await waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(writes).toHaveLength(1); expect(JSON.parse(writes[0]?.body ?? "{}")).toEqual({ reason: "Correct the dilution" });
    expect(writes[0]?.url).toContain(`/test-corrections/response/${kind === "raw" ? "raw-material" : kind === "packaging" ? "packaging-material" : "product"}`);
  });
}
it("history access does not grant the return action", async () => {
  const { writes } = open("raw", [testCorrectionAccess.raw.history]);
  await screen.findByText("Verify the dilution and sample weight.");
  expect(screen.queryByRole("button", { name: "Return to under test" })).toBeNull(); expect(writes).toHaveLength(0);
});
it("a raw return permission cannot return a packaging test", async () => {
  const { writes } = open("packaging", [testCorrectionAccess.raw.return]);
  await waitFor(() => expect(screen.queryByRole("button", { name: "Return to under test" })).toBeNull());
  expect(screen.queryByText("Correction history")).toBeNull(); expect(writes).toHaveLength(0);
});
it("keeps the reason visible when a certificate wins the state race", async () => {
  const { done } = open("product", Object.values(testCorrectionAccess.product), 409);
  fireEvent.click(await screen.findByRole("button", { name: "Return to under test" }));
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByRole("textbox", { name: "Reason for correction" }), { target: { value: "Verify readings" } });
  fireEvent.click(dialog.getByRole("button", { name: "Return to under test" }));
  expect((await dialog.findByRole("alert")).textContent).toContain("already been generated");
  expect(dialog.getByRole("textbox")).toHaveProperty("value", "Verify readings"); expect(done).not.toHaveBeenCalled();
});
