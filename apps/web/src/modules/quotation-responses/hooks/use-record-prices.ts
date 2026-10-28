import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/shared/api/base-api";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { procurementApi } from "@/shared/api/generated/procurement";
import { toast } from "sonner";
import { useCreatePricingMutation, useGetPricingQuery, useUpdatePricingMutation } from "@/modules/suppliers/relationship/relationship-api";
import type { PricingAgreement } from "@/modules/suppliers/relationship/types";
import { useAccess } from "@/shared/auth/use-access";
import { permissionDeniedMessage, usePermissionAction } from "@/shared/auth/use-permission-action";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { usePostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveMutation } from "../api/quotation-response-api";
import { AgreementOutcome, agreementOutcome, agreementFeedback } from "../lib/agreement-outcome";
import { agreementChanges, agreementProposal, type AgreementChange, type AgreementProposal } from "../lib/agreements";
import { negligibleLines, priceLineProblems, startPriceLines, toQuotationResponse, type NegligibleLine, type PriceLine, type PriceLineProblem } from "../lib/price-lines";
import { hasCorrections } from "../lib/open-lines";
import { audit, manageAgreementsPermission, recordResponsePermissions } from "../lib/quotation-response-access";
import type { SupplierQuotation } from "../schemas/quotation-response-schema";

const noAgreements: PricingAgreement[] = [];

/**
 * Recording a supplier's quoted prices, in steps the user can see: check the lines, confirm any line worth
 * almost nothing, then choose whether the prices also change the supplier's standing agreements.
 * With `only`, prices already recorded are being corrected, and just those lines are checked and sent.
 */
export function useRecordPrices(quotation: SupplierQuotation, type: SupplierType, onDone: () => void, only: ReadonlySet<string> | null = null) {
  const { has, allowsNow } = useAccess();
  const permission = usePermissionAction(recordResponsePermissions[type]);
  const supplierId = quotation.supplier.id ?? "";
  const dispatch = useApiDispatch();
  const associations = procurementApi.useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery({ supplierId, ...audit }, { skip: !supplierId || !permission.allowed });
  // Agreements only pre-fill prices and offer a follow-up; the quotation can be recorded without them.
  const pricing = useGetPricingQuery(supplierId, { skip: !supplierId || !permission.allowed });
  const agreements = pricing.data ?? noAgreements;
  const [receive] = usePostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveMutation();
  const [createAgreement] = useCreatePricingMutation();
  const [updateAgreement] = useUpdatePricingMutation();
  const [lines, setLines] = useState<PriceLine[] | null>(null);
  const [problems, setProblems] = useState<readonly PriceLineProblem[]>([]);
  const [toVerify, setToVerify] = useState<readonly NegligibleLine[] | null>(null);
  const [changes, setChanges] = useState<readonly AgreementChange[] | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Start once the agreements have answered (or failed), so typing is never overwritten by a late pre-fill.
  useEffect(() => {
    if (lines === null && !pricing.isLoading && !associations.isLoading) setLines(startPriceLines(quotation, agreements, new Date(), associations.data ?? []));
  }, [lines, pricing.isLoading, associations.isLoading, associations.data, quotation, agreements]);

  const change = useCallback((id: string, update: Partial<Pick<PriceLine, "price" | "priceUnit">>) => {
    setLines((current) => current?.map((line) => line.id === id ? { ...line, ...update } : line) ?? null);
    setProblems((current) => current.filter((problem) => problem.id !== id));
    setToVerify(null);
  }, []);

  // The lines this save is about: all of them when recording, the open ones when correcting.
  const inScope = (all: readonly PriceLine[]) => only ? all.filter((line) => only.has(line.id)) : all;

  const complete = async (proposals: readonly AgreementProposal[]) => {
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    if (proposals.length > 0 && !allowsNow(manageAgreementsPermission)) { setMessage(permissionDeniedMessage); return; }
    if (!lines) return;
    setSaving(true); setMessage("");
    try {
      const saved = await receive({ ...audit, supplierQuotationId: quotation.id, body: toQuotationResponse(inScope(lines)) });
      if ("error" in saved) { setMessage(apiErrorMessage(saved.error)); return; }
      dispatch(api.util.invalidateTags([{ type: "Supplier", id: supplierId }, { type: "Supplier", id: `${supplierId}:pricing` }, { type: "procurement/supplier", id: supplierId }]));
      // Unit changes are proposed atomically by the quotation endpoint; do not create a duplicate proposal here.
      // One at a time, after the prices are safely recorded: a failed proposal must not hide that they were.
      const failures: string[] = [];
      const submitted: AgreementProposal[] = [];
      for (const proposal of proposals) {
        const prior = agreements.find((agreement) => agreement.materialId === proposal.body.materialId && agreement.uoMId === proposal.body.uoMId);
        if (prior && prior.priceUoM.trim().toLowerCase() !== proposal.body.priceUoM.trim().toLowerCase()) { submitted.push(proposal); continue; }
        if (!allowsNow(manageAgreementsPermission)) { failures.push(permissionDeniedMessage); continue; }
        const result = proposal.mode === "create" ? await createAgreement({ supplierId, body: proposal.body }) : await updateAgreement({ supplierId, id: proposal.id, body: proposal.body });
        if ("error" in result) failures.push(apiErrorMessage(result.error));
        else submitted.push(proposal);
      }
      // A refreshed approved list distinguishes immediate activation from an accepted proposal.
      const refreshed = submitted.length ? await pricing.refetch() : null;
      const approved = refreshed && !refreshed.error && refreshed.data
        ? submitted.filter((proposal) => agreementOutcome(proposal, refreshed.data ?? []) === AgreementOutcome.Approved).length : 0;
      const feedback = agreementFeedback(approved, submitted.length - approved);
      if (failures.length > 0) toast.error("Prices saved; some agreement changes failed", {
        description: `${feedback} ${failures.length} of ${proposals.length} failed: ${[...new Set(failures)].join("; ")}`.trim(), duration: 15000,
      });
      else toast.success(only ? "Prices corrected" : "Prices recorded", { description: feedback || "No additional standing-price change was requested." });
      onDone();
    } finally { setSaving(false); }
  };

  const submitPrices = async () => {
    if (!lines) return;
    setMessage("");
    const scope = inScope(lines);
    if (only && !hasCorrections(quotation, lines, only)) { setMessage("Nothing has been changed"); return; }
    const found = priceLineProblems(scope);
    setProblems(found);
    if (found.length > 0) return;
    const negligible = negligibleLines(scope, quotation.supplier.currency);
    if (negligible.length > 0 && toVerify === null) { setToVerify(negligible); return; }
    const proposed = has(manageAgreementsPermission) && pricing.isSuccess ? agreementChanges(scope, agreements) : [];
    if (proposed.length > 0) { setChanges(proposed); return; }
    await complete([]);
  };

  const submitWithAgreements = async (agreedDate: Date) => {
    const proposals: AgreementProposal[] = [];
    for (const item of changes ?? []) {
      const proposal = agreementProposal(item, agreedDate, quotation.id, quotation.supplier.currencyId);
      if ("error" in proposal) { setMessage(proposal.error); return; }
      proposals.push(proposal);
    }
    await complete(proposals);
  };

  return {
    lines, loading: lines === null, problems, toVerify, changes, message, saving, change,
    invalid: useMemo(() => new Map(problems.map((problem) => [problem.id, problem.field])), [problems]),
    submitPrices, submitWithAgreements, recordOnly: () => complete([]), backToPrices: () => { setChanges(null); setMessage(""); },
  };
}
