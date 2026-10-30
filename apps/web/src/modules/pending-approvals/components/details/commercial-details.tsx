import { useMemo } from "react";
import { PackQuantity } from "@/shared/packing/pack-quantity";
import { skipToken } from "@reduxjs/toolkit/query";
import { z } from "zod";
import { rndApi } from "@/shared/api/generated/rnd";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import { formatQuantityNumber } from "@/shared/units/quantity";
import { useGetCustomerQuotationQuery, useGetPayrollRunQuery, useGetPerformanceReviewQuery, useGetPricingProposalQuery } from "../../api/evidence-api";
import { audit } from "../../lib/approval-documents";
import { DetailState, fullName, queryState } from "./detail-state";

const { useGetApiV1RndProjectsByIdQuery, useGetApiV1RndFormulationReviewsByFormulationIdQuery, useGetApiV1RndTechnologyTransferReviewsByTransferIdQuery, useGetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdQuery } = rndApi;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const named = z.object({ name: text, code: text }).nullish();
const currency = z.object({ symbol: text, name: text }).nullish();
const number = (value: number | null) => value === null ? "–" : formatQuantityNumber(value, "calculated");
const words = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
function useParsed<T>(schema: z.ZodType<T>, data: unknown): T | null {
  return useMemo(() => { const parsed = schema.safeParse(data ?? null); return parsed.success ? parsed.data : null; }, [schema, data]);
}

const quotationLine = z.object({ id: z.string().nullish(), productName: text, productPackingName: text, quantity: amount, shippers: amount, loose: amount, unitPrice: amount, discountPercent: amount, totalValue: amount });
const quotationSchema = z.object({ code: text, customerName: text, validUntil: z.string().nullish(), totalValue: amount, currency, items: z.array(quotationLine).nullish() });
type QuotationLine = z.infer<typeof quotationLine> & { key: string };
const quotationColumn = dataTableColumns<QuotationLine>();
/** A price quotation to a customer: the products, their prices and discounts, and what it comes to. */
export function CustomerQuotationDetails({ id }: { id: string }) {
  const query = useGetCustomerQuotationQuery(id);
  const value = useParsed(quotationSchema, query.data);
  const symbol = value?.currency?.symbol ?? value?.currency?.name ?? null;
  const columns = useMemo(() => quotationColumn.columns([
    quotationColumn.accessor((row) => row.productName ?? "", { id: "product", header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.productName ?? "Unnamed product"}</div>
      <div className="text-xs text-muted-foreground">{row.original.productPackingName ?? "Packing not recorded"}</div></div> }),
    quotationColumn.accessor((row) => row.quantity ?? 0, { id: "quantity", header: "Quantity", size: 190, cell: ({ row }) => <PackQuantity packs={row.original.quantity ?? 0} split={{ shippers: row.original.shippers ?? 0, loose: row.original.loose ?? 0 }} /> }),
    quotationColumn.accessor((row) => row.unitPrice ?? 0, { id: "price", header: "Price per pack", size: 150, cell: ({ row }) => formatMoney(row.original.unitPrice, symbol) }),
    quotationColumn.accessor((row) => row.discountPercent ?? 0, { id: "discount", header: "Discount", size: 110, cell: ({ row }) => row.original.discountPercent ? `${number(row.original.discountPercent)}%` : "–" }),
    quotationColumn.accessor((row) => row.totalValue ?? 0, { id: "total", header: "Total", size: 160, cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.totalValue, symbol)}</span> }),
  ]), [symbol]);
  return <DetailState {...queryState(query)} value={value} label="customer quotation">{(quotation) => <div className="space-y-4">
    <DetailGroup title="Quotation"><DetailItem label="Number" value={quotation.code} /><DetailItem label="Customer" value={quotation.customerName} /><DetailItem label="Valid until" value={formatDate(quotation.validUntil)} />
      <DetailItem label="Total value" value={quotation.totalValue === null ? null : formatMoney(quotation.totalValue, symbol)} /></DetailGroup>
    <ClientDataTable label="Products quoted" columns={columns} rows={(quotation.items ?? []).map((line, index) => ({ ...line, key: line.id ?? `q-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="No products on this quotation" />
  </div>}</DetailState>;
}

/** What is being asked of a price agreement. The numbers are the server's. */
const changes: Record<number, string> = { 0: "New agreement", 1: "Price revision", 2: "Archive agreement" };
const proposalSchema = z.object({ changeKind: z.number().nullish(), materialName: text, uoMName: text, agreedPrice: amount, priceUoM: text, currency, priorAgreedPrice: amount, priorPriceUoM: text, priorCurrencySymbol: text,
  effectiveFrom: z.string().nullish(), effectiveTo: z.string().nullish(), notes: text });
const perUnit = (price: number | null, symbol: string | null, unit: string | null) => price === null ? null : `${formatMoney(price, symbol)}${unit ? ` per ${unit}` : ""}`;
/** A proposed price agreement with a supplier, beside the price it would replace. */
export function PricingAgreementDetails({ id, supplierId }: { id: string; supplierId: string | null }) {
  const query = useGetPricingProposalQuery(supplierId ? { supplierId, id } : skipToken);
  const value = useParsed(proposalSchema, query.data);
  if (!supplierId) return <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">The request does not say which supplier the agreement is with, so it cannot be shown.</p>;
  return <DetailState {...queryState(query)} value={value} label="pricing agreement">{(proposal) => { const kind = proposal.changeKind ?? 0; const before = proposal.priorAgreedPrice; const after = proposal.agreedPrice;
    const sameTerms = (proposal.priorPriceUoM ?? proposal.priceUoM) === proposal.priceUoM && (proposal.priorCurrencySymbol ?? proposal.currency?.symbol ?? null) === (proposal.currency?.symbol ?? null);
    const change = before !== null && after !== null && before > 0 && sameTerms ? ((after - before) / before) * 100 : null;
    return <div className="space-y-4">
      <DetailGroup title={changes[kind] ?? "Pricing agreement"}><DetailItem label="Material" value={proposal.materialName} /><DetailItem label="Unit" value={proposal.uoMName} />
        <DetailItem label={kind === 2 ? "Agreed price" : "Proposed price"} value={perUnit(after, proposal.currency?.symbol ?? proposal.currency?.name ?? null, proposal.priceUoM)} />
        {before !== null ? <DetailItem label="Current price" value={perUnit(before, proposal.priorCurrencySymbol, proposal.priorPriceUoM)} /> : null}
        <DetailItem label="Effective from" value={formatDate(proposal.effectiveFrom)} /><DetailItem label="Effective to" value={formatDate(proposal.effectiveTo) ?? "Open ended"} /><DetailItem label="Notes" value={proposal.notes} /></DetailGroup>
      {kind === 2 ? <p role="note" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Approving archives this agreement; its price will no longer be offered when buying this material.</p>
        : change !== null && Math.abs(change) >= 0.005 ? <p role="note" className="rounded-md border bg-muted/50 p-3 text-sm">The proposed price is {number(Math.abs(change))}% {change > 0 ? "above" : "below"} the current one.</p> : null}
    </div>; }}</DetailState>;
}

const payrollSchema = z.object({ periodStart: z.string().nullish(), periodEnd: z.string().nullish(), employeeCount: amount, totalGrossPay: amount, totalNetPay: amount, totalPayeTax: amount,
  totalSsnitEmployeeContribution: amount, totalSsnitEmployerContribution: amount });
const money = (value: number | null) => value === null ? null : formatMoney(value, null);
/** A payroll run: the period, how many people, and what it pays out and withholds. */
export function PayrollRunDetails({ id }: { id: string }) {
  const query = useGetPayrollRunQuery(id);
  const value = useParsed(payrollSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="payroll run">{(run) => <div className="grid gap-3 lg:grid-cols-2">
    <DetailGroup title="Run"><DetailItem label="Period" value={[formatDate(run.periodStart), formatDate(run.periodEnd)].filter(Boolean).join(" to ")} /><DetailItem label="Employees" value={run.employeeCount === null ? null : String(run.employeeCount)} />
      <DetailItem label="Gross pay" value={money(run.totalGrossPay)} /><DetailItem label="Net pay" value={money(run.totalNetPay)} /></DetailGroup>
    <DetailGroup title="Withheld and contributed"><DetailItem label="PAYE tax" value={money(run.totalPayeTax)} /><DetailItem label="Employee SSNIT" value={money(run.totalSsnitEmployeeContribution)} />
      <DetailItem label="Employer SSNIT" value={money(run.totalSsnitEmployerContribution)} /></DetailGroup>
  </div>}</DetailState>;
}

/** The server's rating scale. */
const ratings: Record<number, string> = { 0: "Unsatisfactory", 1: "Needs improvement", 2: "Meets expectations", 3: "Exceeds expectations", 4: "Outstanding" };
const goal = z.object({ goalId: z.string().nullish(), goalTitle: text, achievementPercentage: amount, comments: text });
const reviewSchema = z.object({ employeeName: text, cycleName: text, reviewerName: text, overallRating: z.number().nullish(), selfAssessmentComments: text, managerComments: text, goalRatings: z.array(goal).nullish() });
type Goal = z.infer<typeof goal> & { key: string };
const goalColumn = dataTableColumns<Goal>();
const goalColumns = goalColumn.columns([
  goalColumn.accessor((row) => row.goalTitle ?? "", { id: "goal", header: "Goal", cell: ({ row }) => <span className="break-words font-medium">{row.original.goalTitle ?? "Untitled goal"}</span> }),
  goalColumn.accessor((row) => row.achievementPercentage ?? 0, { id: "achieved", header: "Achieved", size: 130, cell: ({ row }) => row.original.achievementPercentage === null ? "–" : `${number(row.original.achievementPercentage)}%` }),
  goalColumn.accessor((row) => row.comments ?? "", { id: "comments", header: "Comments", cell: ({ row }) => <span className="break-words">{row.original.comments ?? "–"}</span> }),
]);
/** An employee's performance review: the rating, both sides' comments, and each goal. */
export function PerformanceReviewDetails({ id }: { id: string }) {
  const query = useGetPerformanceReviewQuery(id);
  const value = useParsed(reviewSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="performance review">{(review) => <div className="space-y-4">
    <DetailGroup title="Review"><DetailItem label="Employee" value={review.employeeName} /><DetailItem label="Cycle" value={review.cycleName} /><DetailItem label="Reviewer" value={review.reviewerName} />
      <DetailItem label="Overall rating" value={review.overallRating === null || review.overallRating === undefined ? null : ratings[review.overallRating]} />
      <DetailItem label="Self assessment" value={review.selfAssessmentComments} /><DetailItem label="Manager's comments" value={review.managerComments} /></DetailGroup>
    <ClientDataTable label="Goals" columns={goalColumns} rows={(review.goalRatings ?? []).map((item, index) => ({ ...item, key: item.goalId ?? `g-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="No goals were rated" />
  </div>}</DetailState>;
}

/** The stages of an R&D project and of a technology transfer. The numbers are the server's. */
const projectStages = ["Intake", "FeasibilityReview", "InDevelopment", "TechnologyTransfer", "Completed", "OnHold", "Cancelled"];
const projectSchema = z.object({ code: text, title: text, objective: text, product: named, department: named, requestedBy: z.object({ firstName: text, lastName: text }).nullish(), status: z.number().nullish(), targetLaunchDate: z.string().nullish(), createdAt: z.string().nullish() });
type Project = z.infer<typeof projectSchema>;
function ProjectFacts({ project, children }: { project: Project; children?: React.ReactNode }) {
  const stage = project.status === null || project.status === undefined ? null : projectStages[project.status];
  return <DetailGroup title="Project"><DetailItem label="Project" value={[project.code, project.title].filter(Boolean).join(" · ")} /><DetailItem label="Product" value={project.product?.name} /><DetailItem label="Department" value={project.department?.name} />
    <DetailItem label="Requested by" value={fullName(project.requestedBy)} /><DetailItem label="Stage" value={stage ? words(stage) : null} /><DetailItem label="Objective" value={project.objective} />
    <DetailItem label="Target launch" value={formatDate(project.targetLaunchDate) ?? "Not set"} />{children}</DetailGroup>;
}
/** An R&D project put forward for approval. */
export function RndProjectDetails({ id }: { id: string }) {
  const query = useGetApiV1RndProjectsByIdQuery({ ...audit, id });
  const value = useParsed(projectSchema, query.data);
  return <DetailState {...queryState(query)} value={value} label="R&D project">{(project) => <ProjectFacts project={project}><DetailItem label="Created" value={formatDate(project.createdAt)} /></ProjectFacts>}</DetailState>;
}

const formulaItem = z.object({ id: z.string().nullish(), order: amount, material: named, materialType: named, grade: text, casNumber: text, baseQuantity: amount, prescribedQuantity: amount, percentage: amount, baseUoM: z.object({ name: text, symbol: text }).nullish(),
  isSubstitutable: z.boolean().nullish(), substituteMaterialIds: z.array(z.string()).nullish() });
const formulationSchema = z.object({ version: amount, items: z.array(formulaItem).nullish() });
type FormulaItem = z.infer<typeof formulaItem> & { key: string };
const measured = (value: number | null, unit: FormulaItem["baseUoM"]) => value === null ? "–" : [number(value), unit?.symbol ?? unit?.name].filter(Boolean).join(" ");
const formulaColumn = dataTableColumns<FormulaItem>();
const formulaColumns = formulaColumn.columns([
  formulaColumn.accessor((row) => row.order ?? 0, { id: "order", header: "#", size: 60 }),
  formulaColumn.accessor((row) => row.material?.name ?? "", { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.material?.name ?? "–"}</div>
    <div className="text-xs text-muted-foreground">{[row.original.material?.code ?? "No code", row.original.materialType?.name].filter(Boolean).join(" · ")}</div></div> }),
  formulaColumn.accessor((row) => row.baseQuantity ?? 0, { id: "base", header: "Base quantity", size: 150, cell: ({ row }) => measured(row.original.baseQuantity, row.original.baseUoM) }),
  formulaColumn.accessor((row) => row.prescribedQuantity ?? 0, { id: "prescribed", header: "Prescribed", size: 150, cell: ({ row }) => measured(row.original.prescribedQuantity, row.original.baseUoM) }),
  formulaColumn.accessor((row) => row.percentage ?? 0, { id: "percentage", header: "%", size: 90, cell: ({ row }) => row.original.percentage === null ? "–" : `${number(row.original.percentage)}%` }),
  formulaColumn.accessor((row) => row.grade ?? "", { id: "grade", header: "Grade / CAS", cell: ({ row }) => <div><div>{row.original.grade ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.casNumber ?? "No CAS number"}</div></div> }),
  formulaColumn.display({ id: "substitutes", header: "Substitutes", size: 130, cell: ({ row }) => row.original.isSubstitutable ? `${row.original.substituteMaterialIds?.length ?? 0} allowed` : "None" }),
]);
function FormulaTable({ items }: { items: z.infer<typeof formulaItem>[] | null | undefined }) {
  return <ClientDataTable label="Formula" columns={formulaColumns} rows={(items ?? []).map((item, index) => ({ ...item, key: item.id ?? `f-${index}` }))} getRowId={(row) => row.key} fill={false} emptyTitle="The formula has no materials" />;
}
const formulationReviewSchema = z.object({ formulation: formulationSchema.nullish(), project: projectSchema.nullish() });
/** A formulation version put forward for approval, with the project it belongs to. */
export function RndFormulationDetails({ id }: { id: string }) {
  const query = useGetApiV1RndFormulationReviewsByFormulationIdQuery({ ...audit, formulationId: id });
  const value = useParsed(formulationReviewSchema, query.data);
  return <DetailState {...queryState(query)} value={value?.formulation ? value : null} label="R&D formulation">{(review) => <div className="space-y-4">
    {review.project ? <ProjectFacts project={review.project}><DetailItem label="Formulation version" value={review.formulation?.version === null || review.formulation?.version === undefined ? null : `V${review.formulation.version}`} /></ProjectFacts> : null}
    <FormulaTable items={review.formulation?.items} />
  </div>}</DetailState>;
}

const transferStages = ["DueDiligence", "GapAnalysis", "ProtocolApproved", "Completed", "ExecutionInProgress", "ProtocolInReview"];
const transferSchema = z.object({ rndProjectId: z.string().nullish(), rndFormulationId: z.string().nullish(), gapAnalysisFormId: z.string().nullish(), status: z.number().nullish(), protocolApprovalComments: text });
/** A technology transfer: handing a formulation from R&D to production. Shown with its project and the formula being transferred. */
export function RndTransferDetails({ id }: { id: string }) {
  const query = useGetApiV1RndTechnologyTransferReviewsByTransferIdQuery({ ...audit, transferId: id });
  const transfer = useParsed(transferSchema, query.data);
  const projectId = transfer?.rndProjectId ?? null;
  const formulationId = transfer?.rndFormulationId ?? null;
  const projectQuery = useGetApiV1RndProjectsByIdQuery(projectId ? { ...audit, id: projectId } : skipToken);
  const formulationQuery = useGetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdQuery(projectId && formulationId ? { ...audit, rndProjectId: projectId, formulationId } : skipToken);
  const project = useParsed(projectSchema, projectQuery.data);
  const formulation = useParsed(formulationSchema, formulationQuery.data);
  const state = queryState(query);
  const stage = transfer?.status === null || transfer?.status === undefined ? null : transferStages[transfer.status];
  return <DetailState {...state} loading={state.loading || projectQuery.isLoading || formulationQuery.isLoading} value={transfer} label="technology transfer">{(item) => <div className="space-y-4">
    {project ? <ProjectFacts project={project}><DetailItem label="Formulation" value={formulation?.version === null || formulation?.version === undefined ? null : `V${formulation.version}`} /><DetailItem label="Transfer stage" value={stage ? words(stage) : null} />
      <DetailItem label="Gap analysis" value={item.gapAnalysisFormId ? "Linked" : "Not linked"} /><DetailItem label="Protocol comments" value={item.protocolApprovalComments} /></ProjectFacts>
      : <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">The project this transfer belongs to could not be read.</p>}
    {formulation ? <FormulaTable items={formulation.items} /> : <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">The formula being transferred could not be read.</p>}
  </div>}</DetailState>;
}
