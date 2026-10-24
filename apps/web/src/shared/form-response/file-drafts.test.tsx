// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { TestEntry } from "@/shared/qc/test-entry";
import { QuestionType } from "@/shared/questions/question-types";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { formSchema } from "./form-model";
import { storedAnswerRowsSchema } from "./stored-answer-schema";
import { latestAnswers, type StoredAnswers } from "./use-answer-form";

vi.setConfig({ testTimeout: 30_000 });
const template = formSchema.parse({ id: "form-1", sections: [{ id: "s1", name: "Evidence", fields: [
  { id: "upload-1", required: true, question: { type: QuestionType.FileUpload, label: "Result file" } },
] }] });
const stored = (files = false) => latestAnswers(storedAnswerRowsSchema.parse(files ? [
  { responseId: "response-1", value: "form response attachment.", formField: { id: "upload-1" }, attachments: [
    { id: "same-model-id", reference: "one", name: "report.pdf", link: "https://oryx.example/api/v1/file/formresponse/field/one" },
    { id: "same-model-id", reference: "two", name: "evidence.pdf", link: "https://oryx.example/api/v1/file/formresponse/field/two" },
  ] },
] : []));

function Entry({ answers }: { answers: StoredAnswers }) {
  const user = useCurrentUser();
  return user ? <ApiProvider><TestEntry form={template} mine={new Set(["upload-1"])} stored={answers}
    context={{ materialBatchId: "batch-1" }} audit={{ module: "QC", subModule: "Test" }} require="CanStartRawMaterialTest"
    summary={null} onReload={() => {}} onDone={() => {}} /></ApiProvider> : null;
}
function open({ persisted = false, fail = false, pending = false }: { persisted?: boolean; fail?: boolean; pending?: boolean } = {}) {
  const backend = stubBackend({ permissions: ["CanStartRawMaterialTest", "CanExecuteFormulaResponse"] });
  const auth = backend.fetcher.getMockImplementation();
  const requests: { path: string; body: string }[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const body = await input.clone().text();
    requests.push({ path, body });
    if (path === "/api/v1/form/responses/draft") {
      if (pending) await gate;
      return fail ? Response.json({ detail: "Upload failed" }, { status: 500 }) : Response.json("response-1");
    }
    if (path === "/api/v1/form/responses/finalize/response-1") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><Entry answers={stored(persisted)} /></SessionProvider>);
  return { requests, release: () => release() };
}
const file = (name: string, content = "PDF") => new File([content], name, { type: "application/pdf" });
async function choose(name = "report.pdf") {
  const input = await screen.findByLabelText(/Result file/, { selector: 'input[type="file"]' }) as HTMLInputElement;
  await userEvent.upload(input, file(name));
}
afterEach(() => { cleanup(); forgetSession(); });

it("marks the successful file draft saved without a reload and does not upload it again on submit", async () => {
  const { requests } = open();
  await choose();
  fireEvent.click(await screen.findByRole("button", { name: /Save this answer as a draft: Result file/ }));
  const saved = await screen.findByRole("button", { name: "Draft saved: Result file" }) as HTMLButtonElement;
  expect(saved.disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Submit results" }));
  await waitFor(() => expect(requests.some(item => item.path.includes("finalize"))).toBe(true));
  expect(requests.filter(item => item.path.endsWith("/draft"))).toHaveLength(1);
});

it("restores multiple saved attachment links after reopening and satisfies the required file field", async () => {
  open({ persisted: true });
  expect(await screen.findByRole("button", { name: "report.pdf" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "evidence.pdf" })).toBeTruthy();
  expect(await screen.findByRole("button", { name: "Draft saved: Result file" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "Submit results" }) as HTMLButtonElement).disabled).toBe(false);
});

it("keeps an edit made during upload unsaved when the earlier file is acknowledged", async () => {
  const { release } = open({ pending: true });
  await choose("first.pdf");
  fireEvent.click(await screen.findByRole("button", { name: /Save this answer as a draft: Result file/ }));
  await screen.findByRole("button", { name: /Saving…: Result file/ });
  await choose("second.pdf");
  release();
  expect(await screen.findByRole("button", { name: /Save this answer as a draft: Result file/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: "second.pdf" })).toBeTruthy();
});

it("shows upload failure instead of a saved check", async () => {
  open({ fail: true });
  await choose();
  await userEvent.click(await screen.findByRole("button", { name: /Save this answer as a draft: Result file/ }));
  expect(await screen.findByRole("button", { name: /The draft was not saved/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Draft saved: Result file" })).toBeNull();
});
