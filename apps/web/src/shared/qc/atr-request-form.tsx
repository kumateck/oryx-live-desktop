import { z } from "zod";
import type { DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto as AtrDto } from "@/shared/api/generated/analytical";
import type { DomainEntitiesFormsResponseDetailDto as ResponseDto } from "@/shared/api/generated/forms";
import { formatDate, formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { company } from "@/shared/print/company";
import { PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";

/** Printing a product's Analytical Test Request form. */
export const atrRequestPrintPermission = "CanPrintProductAnalyticalTestRequest";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ firstName: text, lastName: text, signature: text }).nullish()
  .transform((value) => value ? { name: `${value.firstName ?? ""} ${value.lastName ?? ""}`.trim() || null, signature: value.signature } : null);
const requestSchema = z.object({
  stage: z.number().nullish(), state: z.object({ name: text }).nullish(), createdAt: z.string().nullish(), createdBy: person,
  manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), filled: text, sampledQuantity: text, numberOfContainers: z.number().nullish(),
  sampledBy: person, sampledAt: z.string().nullish(), acknowledgedBy: person, acknowledgedAt: z.string().nullish(), releasedBy: person, releasedAt: z.string().nullish(),
  batchManufacturingRecord: z.object({ batchNumber: text }).nullish(),
  productionScheduleProduct: z.object({ product: z.object({ name: text, code: text }).nullish(), productPacking: z.object({ name: text }).nullish() }).nullish(),
});
/** The test response behind the certificate: who generated it (checked) and who gave the final approval. */
const certificateSchema = z.object({ checkedBy: person, checkedAt: z.string().nullish(), approvedBy: person, approvedAt: z.string().nullish() });
export type AtrRequest = z.infer<typeof requestSchema> & { certificate: z.infer<typeof certificateSchema> | null };

/** The request as the server returned it, or null when it cannot be read. `response` is the stage's test response, when loaded. */
export function parseAtrRequest(data: AtrDto | null | undefined, response?: ResponseDto | null): AtrRequest | null {
  const parsed = requestSchema.safeParse(data ?? null);
  if (!parsed.success) return null;
  const certificate = certificateSchema.safeParse(response ?? null);
  return { ...parsed.data, certificate: certificate.success ? certificate.data : null };
}

const stages = [{ value: 0, label: "Intermediate" }, { value: 1, label: "Bulk" }, { value: 2, label: "Finished" }] as const;
/** The product states on the paper form, matched to the stored state by name. */
const states = [
  { label: "Liquid", match: "liquid" }, { label: "Granules", match: "granule" }, { label: "Compressed tablets", match: "compressed" },
  { label: "Filled capsules", match: "capsule" }, { label: "Ointment", match: "ointment" }, { label: "Coated", match: "coated" },
] as const;

function Box({ label, checked }: { label: string; checked: boolean }) {
  return <span className="print-check"><span aria-hidden="true" className="print-check-box">{checked ? "✓" : ""}</span>
    <span>{label}</span><span className="sr-only">{checked ? "(ticked)" : "(not ticked)"}</span></span>;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <><span className="print-form-label">{label}:</span> <span>{value === null || value === undefined || value === "" ? "" : value}</span></>;
}

/** A person and when they acted, as one line: "Kofi Mensah · Nov 9, 2026, 10:42 AM". */
const who = (actor: { name: string | null } | null, at: string | null | undefined) => [actor?.name, formatDateTime(at ?? null)].filter(Boolean).join(" · ") || null;

/** A signature block; blank (for signing by hand) until the person has acted. */
const signer = (role: string, actor: { name: string | null; signature: string | null } | null, at: string | null | undefined) =>
  actor?.name ? { role, name: actor.name, signature: actor.signature, signedOn: formatDateTime(at ?? null) } : { role };

/**
 * QA's Analytical Test Request for a product batch (Annexure QAD/SOP/046/F02-04), laid out like the paper form:
 * stage and product state ticked, the batch, the sample, and who prepared, sampled, received and released it.
 */
export function AtrRequestForm({ request }: { request: AtrRequest }) {
  const stateName = request.state?.name?.toLowerCase() ?? "";
  const product = request.productionScheduleProduct?.product;
  return <div className="atr-request-form">
    <PrintHeader title="Analytical test request · Product" reference={`Annexure No. ${company.documents.productTestRequest}`} />
    <table className="print-form-grid" aria-label="Analytical test request">
      <tbody>
        <tr><td colSpan={2}><div className="print-check-row">{stages.map((stage) => <Box key={stage.value} label={stage.label} checked={request.stage === stage.value} />)}</div></td></tr>
        <tr>
          <td><div className="print-check-row">{states.map((state) => <Box key={state.label} label={state.label} checked={stateName.includes(state.match)} />)}</div></td>
          <td><Field label="Date" value={formatDate(request.createdAt)} /></td>
        </tr>
        <tr><td><Field label="Name of product" value={[product?.name, product?.code].filter(Boolean).join(" · ")} /></td>
          <td><Field label="Batch No." value={request.batchManufacturingRecord?.batchNumber} /></td></tr>
        <tr><td><Field label="MFG. date" value={formatMonthYear(request.manufacturingDate)} /></td><td><Field label="EXP. date" value={formatMonthYear(request.expiryDate)} /></td></tr>
        <tr><td><Field label="Filled volume / filled weight / compressed weight" value={request.filled} /></td>
          <td><Field label="Pack style" value={request.productionScheduleProduct?.productPacking?.name} /></td></tr>
        <tr><td><Field label="Prepared by (Production)" value={who(request.createdBy, request.createdAt)} /></td>
          <td><Field label="Sampled by (QA)" value={who(request.sampledBy, request.sampledAt)} /></td></tr>
        <tr><td><Field label="Number of containers sampled" value={request.numberOfContainers} /></td>
          <td><Field label="Received by" value={who(request.acknowledgedBy, request.acknowledgedAt)} /></td></tr>
        <tr><td><Field label="Sampled quantity" value={request.sampledQuantity} /></td><td><Field label="Released on" value={formatDateTime(request.releasedAt ?? null)} /></td></tr>
      </tbody>
    </table>
    <PrintSignatures signers={[
      signer("Prepared by (Production)", request.createdBy, request.createdAt),
      // Released: whoever generated the certificate of analysis. Approved: whoever gave its final approval.
      signer("Released by Manager QC", request.certificate?.checkedBy ?? null, request.certificate?.checkedAt),
      signer("Approved by Manager QA", request.certificate?.approvedBy ?? null, request.certificate?.approvedAt),
    ]} />
  </div>;
}
