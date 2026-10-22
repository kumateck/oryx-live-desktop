// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { loginSession } from "@/shared/auth/session-api";
import { forgetSession, stubBackend } from "@/test/backend";
import { readPayrollExport } from "./lib/read-export";
import { runId } from "./payroll-fixture";
afterEach(forgetSession);
it("reads the original XLSX through the authorized endpoint with its actual FileType parameter", async () => {
  const backend = stubBackend();
  await loginSession("test@example.invalid", "test-only-password");
  let requested = "";
  let bearer = "";
  backend.fetcher.mockImplementation(async (input, init) => {
    requested = String(input);
    bearer = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(new Uint8Array([0x50, 0x4b, 3, 4]));
  });
  const file = await readPayrollExport(runId, "advice", new AbortController().signal, () => true);
  expect(requested).toContain(`/bank-advice?FileType=xlsx`);
  expect(bearer).toContain("Bearer access-login");
  expect(file.size).toBe(4);
});
it("refuses a server error page masquerading as a workbook", async () => {
  const backend = stubBackend();
  await loginSession("test@example.invalid", "test-only-password");
  backend.fetcher.mockImplementation(async () => new Response("<html>Error</html>"));
  await expect(readPayrollExport(runId, "register", new AbortController().signal, () => true)).rejects.toThrow("Excel workbook");
});
it("never reads an export without the current export permission", async () => {
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetcher);
  await expect(readPayrollExport(runId, "advice", new AbortController().signal, () => false)).rejects.toThrow("permission");
  expect(fetcher).not.toHaveBeenCalled();
});
