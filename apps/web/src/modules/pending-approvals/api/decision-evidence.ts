import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { JsonValue } from "@/shared/api/generated/approvals";
import { audit, type ReadableDocument } from "../lib/approval-documents";

export interface EvidenceSubject { type: ReadableDocument; id: string; supplierId: string | null }
export interface DecisionEvidence { entries: { url: string; data: JsonValue }[] }
const paths: Record<ReadableDocument, string> = {
  StockDiscrepancy: "stock-discrepancy", ShipmentDiscrepancy: "procurement/shipment-discrepancy",
  PurchaseOrder: "procurement/purchase-order", BillingSheet: "procurement/billing-sheet", ShipmentDocument: "procurement/shipment-document",
  PurchaseRequisition: "requisition", TrialRequisition: "requisition", StockRequisition: "requisition", RawStockRequisition: "requisition", PackageStockRequisition: "requisition",
  ProductionExtraPacking: "production-schedule/extra-packing", FinishedGoodsTransferNote: "production-schedule/finished-goods-transfer-note",
  LeaveRequest: "leave-request", OvertimeRequest: "overtime-requests", StaffRequisition: "staff-requisitions", JobRequest: "job-requests",
  ProductionOrder: "production-orders", ProformaInvoice: "production-orders/proforma-invoice", AllocateProductionOrder: "production-orders/allocate",
  StockAdjustment: "stock-adjustment", CustomerQuotation: "customers/quotations", SupplierPricingAgreement: "suppliers",
  PayrollRun: "payroll/runs", PerformanceReview: "performance/reviews", RndProject: "rnd/projects",
  RndFormulation: "rnd/formulation-reviews", RndTechnologyTransfer: "rnd/technology-transfer-reviews", Response: "form/responses",
};
const responseSubject = z.object({ form: z.object({ id: z.string().min(1) }), materialBatch: z.object({ id: z.string().min(1) }).nullish(), batchManufacturingRecord: z.object({ id: z.string().min(1) }).nullish() });

/** Structural JSON is evidence only, never a DTO used to render or mutate business data. */
export const decisionEvidenceApi = api.injectEndpoints({ endpoints: (build) => ({
  decisionEvidence: build.query<DecisionEvidence, EvidenceSubject>({
    async queryFn(subject, _context, _options, baseQuery) {
      const read = async (path: string) => {
        const url = `/api/v1/${path}`;
        const result = await baseQuery({ url, headers: { Module: audit.module, SubModule: audit.subModule } });
        if (result.error) throw new Error(apiErrorMessage(result.error));
        return { url, data: z.json().parse(result.data) };
      };
      try {
        if (subject.type === "SupplierPricingAgreement" && !subject.supplierId) throw new Error("The supplier identity is missing.");
        const path = subject.type === "SupplierPricingAgreement"
          ? `suppliers/${encodeURIComponent(subject.supplierId ?? "")}/pricing-agreements/proposals/${encodeURIComponent(subject.id)}`
          : `${paths[subject.type]}/${encodeURIComponent(subject.id)}`;
        const main = await read(path);
        const entries = [main];
        if (subject.type === "Response") {
          const record = responseSubject.parse(main.data);
          const batch = record.materialBatch?.id;
          const bmr = record.batchManufacturingRecord?.id;
          entries.push(...await Promise.all([
            read(`form/${encodeURIComponent(record.form.id)}`),
            ...(batch ? [read(`form/responses/material-batch/${encodeURIComponent(batch)}`)] : bmr ? [read(`form/responses/bmr/${encodeURIComponent(bmr)}`)] : []),
          ]));
        }
        return { data: { entries } };
      } catch (error) {
        return { error: { status: "CUSTOM_ERROR", error: error instanceof Error ? error.message : "Approval evidence could not be verified." } };
      }
    },
    providesTags: [{ type: "PendingApprovals", id: "all" }],
  }),
}) });
