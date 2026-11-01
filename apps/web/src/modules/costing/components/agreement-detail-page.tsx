import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog, DropdownButton } from "@/shared/actions";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useDeleteApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation, useGetApiV1CostingPricingAgreementsByIdQuery, type PricingAgreement } from "../api/costing-api";
import { useCurrencyOptions } from "../hooks/use-costing-choices";
import { agreementsPath, agreementState, agreementStateLabels, costingAudit, costingPermissions, currencyName, customerPath, priceIn } from "../lib/costing";
import { AgreementDialog } from "./agreement-dialog";

function AgreementFacts({ agreement }: { agreement: PricingAgreement }) {
  const state = agreementState(agreement.effectiveFrom, agreement.effectiveTo);
  return <>
    <Badge variant={state === "active" ? "secondary" : "outline"}>{agreementStateLabels[state]}</Badge>
    <KeyFacts>
      <KeyFact label="Price per pack" value={priceIn(agreement.agreedPrice, agreement.currency)} />
      <KeyFact label="Priced in" value={currencyName(agreement.currency)} />
      <KeyFact label="Customer" value={agreement.customerId ? <Link className="text-primary underline-offset-2 hover:underline" to={customerPath(agreement.customerId)}>{agreement.customerName ?? "Customer"}</Link> : agreement.customerName ?? "–"} />
      <KeyFact label="Packing style" value={agreement.productPackingName ?? "–"} />
      <KeyFact label="In effect" value={`${formatDate(agreement.effectiveFrom) ?? "–"} to ${agreement.effectiveTo ? formatDate(agreement.effectiveTo) ?? "–" : "open"}`} />
    </KeyFacts>
    <dl><dt className="text-sm text-muted-foreground">Notes</dt><dd className="whitespace-pre-wrap break-words">{agreement.notes || "No notes recorded."}</dd></dl>
  </>;
}

function AgreementDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const query = useGetApiV1CostingPricingAgreementsByIdQuery({ ...costingAudit, id }, { refetchOnMountOrArgChange: true });
  const [remove] = useDeleteApiV1CustomersByIdPricingAgreementsAndAgreementIdMutation();
  const currencies = useCurrencyOptions();
  const [open, setOpen] = useState<"edit" | "remove" | null>(null);
  const agreement = query.currentData;
  if (query.isLoading) return <DetailPageSkeleton label="Loading pricing agreement" groups={3} />;
  if (query.error || !agreement?.id || agreement.id !== id) return <section role="alert" className="space-y-3"><h1 className="font-semibold">Pricing agreement unavailable</h1>
    <p>{query.error ? apiErrorMessage(query.error) : "The server did not return this agreement."}</p><div className="flex gap-2"><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild><Link to={agreementsPath}>Customer agreements</Link></Button></div></section>;
  const title = `${agreement.productName ?? "Product"} for ${agreement.customerName ?? "customer"}`;
  return <article className="space-y-4">
    <PageHeader title={title} crumbs={[{ label: "Costing", to: "/finance/costing" }, { label: "Customer agreements", to: agreementsPath }, { label: agreement.productName ?? "Agreement" }]}
      actions={<DropdownButton label="Actions" items={[
        { id: "edit", label: "Edit agreement", icon: Pencil, require: costingPermissions.manage, onSelect: () => setOpen("edit") },
        { id: "remove", label: "Remove agreement", icon: Trash2, destructive: true, separated: true, require: costingPermissions.manage, onSelect: () => setOpen("remove") },
      ]} />} />
    <AgreementFacts agreement={agreement} />
    {open === "edit" ? <AgreementDialog agreement={agreement} currencies={currencies.options} onClose={() => setOpen(null)} /> : null}
    {open === "remove" ? <ConfirmActionDialog require={costingPermissions.manage} title="Remove this pricing agreement?" description={`Quotations for ${agreement.productName ?? "this product"} go back to its list price. Quotations already raised keep their prices.`}
      confirmLabel="Remove agreement" busyLabel="Removing…" onClose={() => setOpen(null)} onConfirm={async () => {
        if (!agreement.customerId) return "The agreement has no customer recorded.";
        const result = await remove({ ...costingAudit, id: agreement.customerId, agreementId: id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Pricing agreement removed"); void navigate(agreementsPath, { replace: true }); return null; }} /> : null}
  </article>;
}

export function AgreementDetailPage() { const { id } = useParams(); return id ? <AgreementDetail key={id} id={id} /> : <p role="alert">Pricing agreement ID is missing.</p>; }
