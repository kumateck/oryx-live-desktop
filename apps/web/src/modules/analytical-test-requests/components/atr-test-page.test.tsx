// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { SessionReady } from "@/test/session-ready";
import { AtrProgressPage, AtrTestPage } from "./atr-pages";

vi.setConfig({ testTimeout: 30_000 });
const me = { id: testUserId, firstName: "Ada", lastName: "Mensah" };
const field = (id: string, label: string, rank: number) => ({ id, rank, required: true, question: { type: 0, label } });

/** A fresh request whose test has no response yet, like the first draft of a new ATR. */
function open(existingEmptyResponse = false) {
  const backend = stubBackend({ permissions: ["CanStartProductTest", "CanExecuteFormulaResponse"] });
  const auth = backend.fetcher.getMockImplementation();
  const requests: string[] = [];
  let responseId: string | null = existingEmptyResponse ? "response-1" : null;
  const saved = new Map<string, string>();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    requests.push(`${input.method} ${path}`);
    if (path === "/api/v1/qa/analytical-tests/atr-1") return Response.json({ id: "atr-1", status: 3, stage: 2, batchManufacturingRecord: { id: "bmr-1", batchNumber: "B-1" },
      productionActivityStep: { id: "step-1" }, productionScheduleProduct: { product: { id: "product-1", name: "Paracetamol" } } });
    if (path === "/api/v1/product-ard/product/product-1") return Response.json([{ stage: 2, form: { id: "form-1", name: "Finished product test" } }]);
    if (path === "/api/v1/form/form-1") return Response.json({ id: "form-1", name: "Finished product test", sections: [{ id: "s1", name: "Physical", fields: [field("appearance", "Appearance", 1), field("colour", "Colour", 2)] }] });
    if (path === "/api/v1/form/assignees/bmr/bmr-1") return Response.json({ id: "assignee-1", fieldAssignees: [
      { formField: { id: "appearance", question: { label: "Appearance" } }, assignee: me }, { formField: { id: "colour", question: { label: "Colour" } }, assignee: me }] });
    if (path === "/api/v1/form/response") return responseId ? Response.json(responseId) : new Response(null, { status: 404 });
    if (path === "/api/v1/form/responses/draft") {
      const body = await input.clone().json() as { formFieldId: string; value: string; responseId?: string };
      if (existingEmptyResponse) expect(body.responseId).toBe("response-1");
      saved.set(body.formFieldId, body.value);
      responseId = "response-1";
      return Response.json(responseId);
    }
    if (path === "/api/v1/form/responses/response-1") return Response.json({ formResponses: [...saved].map(([id, value]) => ({ responseId: "response-1", value, formField: { id } })) });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter initialEntries={["/atr/atr-1/test"]}>
    <Routes>
      <Route path="/atr/:id/test" element={<AtrTestPage />} />
      <Route path="/atr/:id/progress" element={<AtrProgressPage />} />
    </Routes>
  </MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  return requests;
}
afterEach(() => { cleanup(); forgetSession(); });

it("saves the first reading into an empty response created by formula repair", async () => {
  open(true);
  const appearance = await screen.findByRole("textbox", { name: "Appearance" });
  fireEvent.change(appearance, { target: { value: "White tablet" } });
  fireEvent.click(screen.getByRole("button", { name: "Save this answer as a draft: Appearance" }));
  await screen.findByRole("button", { name: "Draft saved: Appearance" });
  expect((screen.getByRole("textbox", { name: "Appearance" }) as HTMLInputElement).value).toBe("White tablet");
});

it("saves the first draft without reloading the page or clearing other unsaved answers", async () => {
  const requests = open();
  const appearance = await screen.findByRole("textbox", { name: "Appearance" });
  const colour = screen.getByRole("textbox", { name: "Colour" });
  fireEvent.change(appearance, { target: { value: "White tablet" } });
  fireEvent.change(colour, { target: { value: "Off-white, not yet saved" } });

  fireEvent.click(screen.getByRole("button", { name: "Save this answer as a draft: Appearance" }));
  await screen.findByRole("button", { name: "Draft saved: Appearance" });
  // The saved response is read again in the background, by its own id.
  await waitFor(() => expect(requests).toContain("GET /api/v1/form/responses/response-1"));

  expect(screen.queryByText("Loading test request")).toBeNull();
  // The same inputs stay mounted: the page was never swapped for its loading skeleton.
  expect(screen.getByRole("textbox", { name: "Colour" })).toBe(colour);
  expect((colour as HTMLInputElement).value).toBe("Off-white, not yet saved");
  expect((screen.getByRole("textbox", { name: "Appearance" }) as HTMLInputElement).value).toBe("White tablet");
  expect(screen.getByRole("button", { name: "Save this answer as a draft: Colour" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Test progress" })).toHaveProperty("disabled", true);
  // Saving an answer does not change who was assigned, so assignments are not fetched again.
  expect(requests.filter((request) => request === "GET /api/v1/form/assignees/bmr/bmr-1")).toHaveLength(1);
});

it("shows test progress and prints only saved worksheet answers", async () => {
  open();
  const appearance = await screen.findByRole("textbox", { name: "Appearance" });
  fireEvent.change(appearance, { target: { value: "White tablet" } });
  fireEvent.click(screen.getByRole("button", { name: "Save this answer as a draft: Appearance" }));
  await screen.findByRole("button", { name: "Draft saved: Appearance" });
  fireEvent.click(screen.getByRole("link", { name: "Test progress" }));

  expect(await screen.findByText("Worksheet in progress · shows saved answers")).toBeTruthy();
  expect(within(screen.getByRole("row", { name: /Appearance/ })).getByText("Completed")).toBeTruthy();
  expect(within(screen.getByRole("row", { name: /Colour/ })).getByText("Outstanding")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Print filled worksheet" }));

  const preview = within(await screen.findByRole("dialog"));
  expect(preview.getByText("Finished product test")).toBeTruthy();
  expect(preview.getByText("Worksheet in progress · saved responses")).toBeTruthy();
  expect(preview.getAllByText("White tablet").length).toBeGreaterThan(0);
});
