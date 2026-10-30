import { useEffect, useMemo, useState } from "react";
import { formatShippers } from "@/shared/packing/packs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FileText, PackageCheck, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery, useGetApiV1ProductionOrdersAllocateQuery, usePostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillMutation,
  usePutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdMutation, usePutApiV1ProductionOrdersLoadByAllocateProductionOrderIdMutation } from "../api/dispatch-api";
import { allocationKinds, allocationPath, allocationsPath, audit, dispatchPermissions, nextStep, packingRows, packingTotals, stepLabels, type AllocationKind, type DispatchStep } from "../lib/dispatch";
import { allocationRowsSchema, allocationSchema, waybillSchema, type Allocation, type WaybillValues } from "../schemas/dispatch-schema";
import { PackingListPrint, PackingListTable } from "./packing-list-view";
import { ProformaDialog } from "./proforma-dialog";

const waybillFields: WizardField<WaybillValues>[] = [
  { type: InputTypes.TEXT, name: "code", label: "Waybill number", required: true },
  { type: InputTypes.RICHTEXT, name: "comment", label: "Comments" },
];
function WaybillDialog({ allocation, onClose }: { allocation: Allocation; onClose: () => void }) {
  const [create, mutation] = usePostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillMutation();
  const code = useGeneratedCode("Waybill");
  const [message, setMessage] = useState("");
  const form = useForm<WaybillValues>({ resolver: zodResolver(waybillSchema), defaultValues: { code: "", comment: "" } });
  void form.formState.errors;
  // The next waybill number is suggested once; what the user types is never replaced.
  useEffect(() => { if (code.ready) void code.suggest().then((next) => { if (next && !form.getValues("code")) form.setValue("code", next, { shouldValidate: true }); }); }, [code.ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const busy = mutation.isLoading;
  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const result = await create({ ...audit, allocateProductionOrderId: allocation.id, domainEntitiesProductionOrdersCreateProductionOrderWaybill: { code: values.code, comment: values.comment.trim() || null } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(`Waybill ${values.code} created`);
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Create waybill · {allocation.orderCode ?? "order"}</DialogTitle><DialogDescription>The waybill travels with the goods to {allocation.customer.name}.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3"><FormWizard form={form} fields={waybillFields} />{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Saving…</> : "Create waybill"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

/** One step of getting an allocation to the customer: loading and delivery are confirmed, a waybill is filled in. */
function StepDialog({ step, allocation, onClose }: { step: DispatchStep; allocation: Allocation; onClose: () => void }) {
  const [load] = usePutApiV1ProductionOrdersLoadByAllocateProductionOrderIdMutation();
  const [deliver] = usePutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdMutation();
  if (step === "waybill") return <WaybillDialog allocation={allocation} onClose={onClose} />;
  const loading = step === "load";
  return <ConfirmActionDialog require={stepPermission(step, allocation.approved ? 1 : 0)} destructive={false} title={`${stepLabels[step]}: ${allocation.orderCode ?? "this order"}?`}
    description={loading ? `The goods for ${allocation.customer.name} are recorded as loaded onto the vehicle. This cannot be undone.` : `The goods are recorded as delivered to ${allocation.customer.name}. This cannot be undone.`}
    confirmLabel={stepLabels[step]} busyLabel="Saving…" onClose={onClose} onConfirm={async () => {
      const result = loading ? await load({ ...audit, allocateProductionOrderId: allocation.id }) : await deliver({ ...audit, allocateProductionOrderId: allocation.id });
      if ("error" in result) return apiErrorMessage(result.error);
      toast.success(loading ? "Marked as loaded" : "Marked as delivered");
      return null; }} />;
}
const stepIcons = { load: PackageCheck, waybill: FileText, deliver: Truck } as const;
const stepPermission = (step: DispatchStep, kind: AllocationKind) => step === "waybill" ? dispatchPermissions.createWaybill : allocationKinds[kind].permission;

const column = dataTableColumns<Allocation>();
/** Packing lists waiting for approval, or approved allocations on their way to the customer. */
export function AllocationListPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kind: AllocationKind = params.get("type") === "1" ? 1 : 0;
  const config = allocationKinds[kind];
  const [acting, setActing] = useState<{ step: DispatchStep; allocation: Allocation } | null>(null);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch(config.title.toLowerCase(), busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const allowed = has(config.permission);
  const query = useGetApiV1ProductionOrdersAllocateQuery({ ...audit, page: table.page, pageSize: table.pageSize, approved: kind === 1, ...(search.trim() ? { searchQuery: search } : {}) }, { skip: !allowed });
  const parsed = useMemo(() => query.data ? allocationRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.invoiceCode ?? "", { id: "invoice", header: "Invoice", size: 220, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.invoiceCode ?? "No invoice yet"}</div><div className="text-xs text-muted-foreground">Order {row.original.orderCode ?? "–"}</div></div> }),
    column.accessor((row) => row.customer.name, { id: "customer", header: "Customer", cell: ({ row }) => <span className="break-words">{row.original.customer.name}</span> }),
    column.accessor((row) => row.createdAt ?? "", { id: "created", header: "Created", size: 170, cell: ({ row }) => <div><div>{formatDate(row.original.createdAt) ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.products.length} {row.original.products.length === 1 ? "product" : "products"}</div></div> }),
    column.display({ id: "movement", header: "Loaded and delivered", size: 210, cell: ({ row }) => <div><div>Loaded {formatDate(row.original.loadedAt) ?? "not yet"}</div><div className="text-xs text-muted-foreground">Delivered {formatDate(row.original.deliveredAt) ?? "not yet"}</div></div> }),
    column.display({ id: "documents", header: "Documents", size: 190, cell: ({ row }) => <div className="flex flex-wrap gap-1"><Badge variant={row.original.hasInvoice ? "default" : "outline"}>Invoice {row.original.hasInvoice ? "raised" : "missing"}</Badge>
      <Badge variant={row.original.hasWaybill ? "default" : "outline"}>Waybill {row.original.hasWaybill ? "raised" : "missing"}</Badge></div> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const step = nextStep(row.original);
      return <TableMenu label={`Actions for order ${row.original.orderCode ?? row.original.id}`} items={[{ id: "view", label: "View", icon: Eye, to: allocationPath(row.original.id) },
        step !== null && { id: step, label: stepLabels[step], icon: stepIcons[step], require: stepPermission(step, kind), onSelect: () => setActing({ step, allocation: row.original }) }]} />; } }),
  ]), [kind]);
  if (!allowed) return <NoAccess />;
  return <section className="page-fill">
    <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">{config.title}</h1>
      <p className="text-sm text-muted-foreground">{kind === 0 ? "Packing lists waiting for approval." : "Approved allocations: invoice them, load them, raise the waybill, then mark them delivered."}</p></div>
    <ServerDataTable label={config.title} columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(allocationPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned packing lists the app could not read." : null}
      emptyTitle={search.trim() ? "Nothing matches this search" : `No ${config.title.toLowerCase()}`} emptyDescription={search.trim() ? "Search by order or invoice number." : "A packing list is generated from a production order."} />
    {acting ? <StepDialog key={`${acting.allocation.id}:${acting.step}`} step={acting.step} allocation={acting.allocation} onClose={() => setActing(null)} /> : null}
  </section>;
}

function Detail({ allocation }: { allocation: Allocation }) {
  const { has } = useAccess();
  const [invoicing, setInvoicing] = useState(false);
  const [acting, setActing] = useState<DispatchStep | null>(null);
  const kind: AllocationKind = allocation.approved ? 1 : 0;
  const step = nextStep(allocation);
  const totals = packingTotals(packingRows(allocation.products.map((product) => ({ name: product.name, sources: product.sources }))));
  const back = `${allocationsPath}?type=${kind}`;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Packing list · ${allocation.orderCode ?? "order"}`} crumbs={[{ label: allocationKinds[kind].title, to: back }, { label: allocation.orderCode ?? "Packing list" }]} actions={<>
      <PrintButton preview={(close) => <PackingListPrint allocation={allocation} onClose={close} />} />
      {!allocation.hasInvoice && has(dispatchPermissions.generateProforma) ? <Button type="button" size="sm" variant="outline" onClick={() => setInvoicing(true)}><FileText />Generate proforma invoice</Button> : null}
      {step && has(stepPermission(step, kind)) ? <Button type="button" size="sm" onClick={() => setActing(step)}>{stepLabels[step]}</Button> : null}
    </>} />
    <div className="flex flex-wrap items-center gap-2"><Badge variant={allocation.approved ? "default" : "outline"}>{allocation.approved ? "Approved" : "Awaiting approval"}</Badge>
      <Badge variant={allocation.hasInvoice ? "secondary" : "outline"}>Invoice {allocation.hasInvoice ? allocation.invoiceCode ?? "raised" : "missing"}</Badge><Badge variant={allocation.hasWaybill ? "secondary" : "outline"}>Waybill {allocation.hasWaybill ? "raised" : "missing"}</Badge></div>
    {!allocation.approved ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">This packing list is waiting for approval. It can be invoiced, loaded and shipped once it is approved.</p> : null}
    <KeyFacts>
      <KeyFact label="Shippers and loose" value={formatShippers(totals)} note={`${totals.packs.toLocaleString()} packs`} />
      <KeyFact label="Products" value={allocation.products.length} />
      <KeyFact label="Created" value={formatDateTime(allocation.createdAt) ?? "–"} />
      <KeyFact label="Loaded" value={formatDate(allocation.loadedAt) ?? "Not yet"} note={`Delivered ${formatDate(allocation.deliveredAt) ?? "not yet"}`} />
    </KeyFacts>
    <DetailGroup title="Customer"><DetailItem label="Company" value={allocation.customer.name} /><DetailItem label="Email" value={allocation.customer.email} /><DetailItem label="Phone" value={allocation.customer.phone} /><DetailItem label="Address" value={allocation.customer.address} />
      <DetailItem label="Production order" value={allocation.orderId ? <Link className="text-primary underline-offset-2 hover:underline" to={`/crm/production-order/${allocation.orderId}`}>{allocation.orderCode ?? "Open order"}</Link> : allocation.orderCode} /></DetailGroup>
    <PackingListTable allocation={allocation} />
    {invoicing ? <ProformaDialog allocation={allocation} onClose={() => setInvoicing(false)} /> : null}
    {acting ? <StepDialog key={acting} step={acting} allocation={allocation} onClose={() => setActing(null)} /> : null}
  </article>;
}

/** One packing list or allocation: who it is for, what is packed, and where it stands. */
export function AllocationDetailPage() {
  const { id = "" } = useParams();
  const query = useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery({ ...audit, allocateProductionOrderId: id }, { skip: !id });
  const allocation = useMemo(() => { const parsed = allocationSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading packing list" groups={3} />;
  if (!allocation) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Packing list unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a packing list the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={allocationsPath}>Packing lists</Link></Button></div></div>;
  return <Detail allocation={allocation} />;
}
