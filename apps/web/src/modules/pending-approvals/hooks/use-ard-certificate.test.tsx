// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { useArdCertificate } from "./use-ard-certificate";

const field = { id: "assay", question: { type: 10, label: "Assay" } };
const recorded = { responseId: "response", formField: field, value: '{"assay":101.21}', complies: false };
const converted = { key: "average", label: "Average", sourceValue: 101.21, value: 2.42904, displayValue: "2.4290", unit: "% w/v",
  minimum: 2.32, maximum: 2.52, complies: true, nominalConcentration: 2.4, definitionHash: "formula", converted: true, decimalPlaces: 4 };
function Certificate() {
  const sheet = useArdCertificate("response");
  if (sheet.loading) return <p>Loading</p>;
  return <><output aria-label="Assay result">{sheet.recorded.get("assay")?.coaReportedResults?.[0]?.displayValue}</output>
    <output aria-label="Failing tests">{sheet.failures}</output></>;
}
afterEach(() => { cleanup(); forgetSession(); });
it("uses the latest response conversion instead of an older batch-answer cache and percentage verdict", async () => {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals"] }); rememberSession();
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/form/responses/response") return Response.json({ form: { id: "form" }, batchManufacturingRecord: { id: "bmr" }, approved: false,
      checkedAt: "2026-11-20T10:00:00Z", formResponses: [{ ...recorded, coaReportedResults: [converted] }] });
    if (path === "/api/v1/form/form") return Response.json({ sections: [{ id: "section", name: "Assay", fields: [field] }] });
    if (path === "/api/v1/form/responses/bmr/bmr") return Response.json([recorded]);
    if (path === "/api/v1/production-schedule/manufacturing/bmr") return Response.json({ id: "bmr", batchNumber: "L001K074" });
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider><Certificate /></ApiProvider></SessionProvider>);
  expect((await screen.findByRole("status", { name: "Assay result" })).textContent).toBe("2.4290");
  expect(screen.getByRole("status", { name: "Failing tests" }).textContent).toBe("0");
});
