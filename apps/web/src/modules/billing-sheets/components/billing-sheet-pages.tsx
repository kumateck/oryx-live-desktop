import { Link, useNavigate, useParams } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useBillingSheet, useBillingSheets } from "../hooks/use-billing-sheets";
import { billingPermissions, billingSheetPath, billingSheetsPath, createBillingSheetPath } from "../lib/billing-access";
import type { BillingSheet } from "../schemas/billing-schema";
import { BillingSheetDetail } from "./billing-sheet-detail";
import { BillingSheetsTable } from "./billing-sheets-table";
import { EditBillingSheetForm } from "./edit-billing-sheet-form";

export function BillingSheetListPage() {
  const list = useBillingSheets();
  const { has } = useAccess();
  const navigate = useNavigate();
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">LOGISTICS</p><h1 className="text-xl font-semibold">Billing sheets</h1></div>
      {has(billingPermissions.create) ? <Button asChild size="sm"><Link to={createBillingSheetPath()}><Plus />New billing sheet</Link></Button> : null}
    </div>
    <BillingSheetsTable rows={list.rows} search={list.search} paging={list.paging} loading={list.loading} refreshing={list.refreshing} error={list.error} onRetry={list.retry} onOpen={(row) => void navigate(billingSheetPath(row.id))} />
  </section>;
}

function Loaded({ id, children }: { id: string; children: (sheet: BillingSheet) => React.ReactNode }) {
  const state = useBillingSheet(id);
  if (state.loading) return <DetailPageSkeleton label="Loading billing sheet" />;
  if (!state.sheet) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Billing sheet unavailable</h1><p className="text-sm text-muted-foreground">{state.error ?? "The server returned a billing sheet the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={state.retry}>Retry</Button><Button asChild size="sm"><Link to={billingSheetsPath}>All billing sheets</Link></Button></div></div>;
  return <>{children(state.sheet)}</>;
}

export function BillingSheetDetailPage() {
  const { id } = useParams();
  return id ? <Loaded id={id}>{(sheet) => <BillingSheetDetail sheet={sheet} />}</Loaded> : null;
}
/** Keyed by the sheet so a refetch behind the form never resets what is being typed. */
export function BillingSheetEditPage() {
  const { id } = useParams();
  return id ? <Loaded id={id}>{(sheet) => <EditBillingSheetForm key={sheet.id} sheet={sheet} />}</Loaded> : null;
}
