// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import type { CreateSheetValues } from "../schemas/billing-schema";
import { BillingSheetNumber } from "./billing-sheet-number";

function NumberForm({ initial }: { initial: string }) {
  const form = useForm<CreateSheetValues>({ defaultValues: { code: initial } });
  return <FormProvider {...form}><form><BillingSheetNumber /></form></FormProvider>;
}

function open({ count = 24, failCountOnce = false, ruleFailure, initial = "" }: {
  count?: number | null; failCountOnce?: boolean; ruleFailure?: { enabled: boolean }; initial?: string;
} = {}) {
  const backend = stubBackend();
  const auth = backend.fetcher.getMockImplementation();
  const calls: { path: string; params: URLSearchParams; module: string | null; subModule: string | null }[] = [];
  let countReads = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, params: url.searchParams, module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
    if (url.pathname === "/api/v1/configuration/by-model-type/BillingSheet") {
      return ruleFailure?.enabled ? new Response(null, { status: 503 })
        : Response.json({ prefix: "BS-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    }
    if (url.pathname === "/api/v1/procurement/billing-sheet") {
      countReads++;
      return failCountOnce && countReads === 1 ? new Response(null, { status: 503 })
        : Response.json({ data: [], ...(count === null ? {} : { totalRecordCount: count }) });
    }
    // This is the actual backend's behavior: the generic counter does not support BillingSheet.
    return Response.json({ detail: "Invalid model type sent" }, { status: 400 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><NumberForm initial={initial} /></ApiProvider></SessionProvider>);
  return calls;
}

afterEach(() => { cleanup(); forgetSession(); });
const number = () => screen.getByRole("textbox", { name: /Billing sheet number/ }) as HTMLInputElement;

it("uses the existing configured generator with the total billing-sheet count and its audit headers", async () => {
  const calls = open();
  await waitFor(() => expect(number().value).toBe("BS-0025"));
  const reads = calls.filter((call) => call.path === "/api/v1/procurement/billing-sheet");
  expect(reads).toHaveLength(1);
  expect(reads[0]).toMatchObject({ module: "Logistics", subModule: "Billing Sheets" });
  expect(reads[0]?.params.get("page")).toBe("1");
  expect(reads[0]?.params.get("pageSize")).toBe("1");
  expect(reads[0]?.params.has("status")).toBe(false);
  expect(reads[0]?.params.has("searchQuery")).toBe(false);
  expect(calls.some((call) => call.path === "/api/v1/configuration/BillingSheet/count")).toBe(false);
});

it("keeps a manually entered number until the user explicitly generates another", async () => {
  const user = userEvent.setup();
  const calls = open({ initial: "MANUAL-9" });
  await waitFor(() => expect(calls.filter((call) => call.path === "/api/v1/procurement/billing-sheet")).toHaveLength(1));
  await waitFor(() => expect((screen.getByRole("button", { name: "Generate again" }) as HTMLButtonElement).disabled).toBe(false));
  expect(number().value).toBe("MANUAL-9");
  await user.click(screen.getByRole("button", { name: "Generate again" }));
  await waitFor(() => expect(number().value).toBe("BS-0025"));
  expect(calls.filter((call) => call.path === "/api/v1/procurement/billing-sheet")).toHaveLength(2);
});

it("shows a failed count and retries a fresh list read instead of inventing the first number", async () => {
  const user = userEvent.setup();
  const calls = open({ failCountOnce: true });
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(number().value).toBe("");
  await user.click(screen.getByRole("button", { name: "Retry number generation" }));
  await waitFor(() => expect(number().value).toBe("BS-0025"));
  expect(calls.filter((call) => call.path === "/api/v1/procurement/billing-sheet")).toHaveLength(2);
});

it("can reload the configured rule after a temporary configuration read failure", async () => {
  const user = userEvent.setup();
  const ruleFailure = { enabled: true };
  const calls = open({ ruleFailure });
  await screen.findByRole("alert");
  const previousReads = calls.filter((call) => call.path === "/api/v1/configuration/by-model-type/BillingSheet").length;
  ruleFailure.enabled = false;
  expect(number().value).toBe("");
  await user.click(screen.getByRole("button", { name: "Retry number generation" }));
  await waitFor(() => expect(number().value).toBe("BS-0025"));
  expect(calls.filter((call) => call.path === "/api/v1/configuration/by-model-type/BillingSheet")).toHaveLength(previousReads + 1);
});

it.each([null, -1, 2.5])("does not generate a number from a missing or invalid count (%s)", async (count) => {
  open({ count });
  await screen.findByRole("alert");
  expect(number().value).toBe("");
});
