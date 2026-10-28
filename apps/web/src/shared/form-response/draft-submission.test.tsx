// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { TestEntry } from "@/shared/qc/test-entry";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { formSchema } from "./form-model";
import type { StoredAnswers } from "./use-answer-form";

const template = formSchema.parse({ id: "form-1", sections: [{ id: "s1", name: "Results", fields: [
  { id: "appearance", required: false, question: { type: 0, label: "Appearance" } },
  { id: "identity", required: false, question: { type: 0, label: "Identity" } },
] }] });
const saved: StoredAnswers = new Map([
  ["appearance", { value: "Complies", responseId: "response-1" }],
  ["identity", { value: "Complies", responseId: "response-1" }],
]);
function Entry({ stored }: { stored: StoredAnswers }) {
  const user = useCurrentUser();
  return user ? <ApiProvider><TestEntry form={template} mine={new Set(["appearance"])} stored={stored}
    context={{ batchManufacturingRecordId: "batch-1", productionActivityStepId: "step-1" }}
    audit={{ module: "QC", subModule: "Test" }} require="CanStartProductTest" summary={null} onReload={() => {}} onDone={() => {}} /></ApiProvider> : null;
}
function open(stored: StoredAnswers = saved) {
  const backend = stubBackend({ permissions: ["CanStartProductTest", "CanExecuteFormulaResponse"] });
  const auth = backend.fetcher.getMockImplementation();
  const requests: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    requests.push(path);
    if (path.endsWith("/draft")) return Response.json("response-1");
    if (path.includes("/finalize/")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><Entry stored={stored} /></SessionProvider>);
  return requests;
}
afterEach(() => { cleanup(); forgetSession(); });
const submitButton = () => screen.getByRole("button", { name: "Submit results" }) as HTMLButtonElement;

it("blocks cleared or edited saved answers until the changed draft is saved explicitly", async () => {
  const requests = open();
  const input = await screen.findByRole("textbox", { name: "Appearance" });
  expect(submitButton().disabled).toBe(false);
  fireEvent.change(input, { target: { value: "" } });
  expect(submitButton().disabled).toBe(true);
  expect(screen.queryByRole("button", { name: "Draft saved: Appearance" })).toBeNull();
  fireEvent.change(input, { target: { value: "New observation" } });
  expect(submitButton().disabled).toBe(true);
  const form = input.closest("form");
  if (!form) throw new Error("Missing answer form");
  fireEvent.submit(form);
  await screen.findByRole("alert");
  expect(requests).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Save this answer as a draft: Appearance" }));
  await waitFor(() => expect(submitButton().disabled).toBe(false));
  fireEvent.click(submitButton());
  await waitFor(() => expect(requests.filter(path => path.includes("/finalize/"))).toHaveLength(1));
  expect(requests.filter(path => path.endsWith("/draft"))).toHaveLength(1);
});

it("blocks submission when another analyst's optional field has a null saved draft", async () => {
  const requests = open(new Map([...saved, ["identity", { value: null, responseId: "response-1" }]]));
  await screen.findByRole("textbox", { name: "Appearance" });
  expect(submitButton().disabled).toBe(true);
  expect(screen.getByText(/Identity: Complete this answer and save its draft/)).toBeTruthy();
  expect(requests).toHaveLength(0);
});
