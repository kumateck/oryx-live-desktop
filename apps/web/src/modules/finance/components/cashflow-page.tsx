import { lazy, Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/shared/auth/use-access";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { financeApi } from "../api/finance-api";
import { financeAudit, financePermissions } from "../lib/access";
import { dayEndUtc } from "../lib/payments";
import { CashflowSummary, ExchangeRates } from "./cashflow-summary";
import { AgingTable } from "./aging-table";
import { PaymentToolbar } from "./payment-toolbar";
const CurrencyDialog = lazy(() => import("./currency-dialog").then((module) => ({ default: module.CurrencyDialog })));
const schema = z.object({ asOf: z.date() });
const fields: WizardField<z.infer<typeof schema>>[] = [{ type: InputTypes.DATE, name: "asOf", label: "As of date", required: true }];
export function CashflowPage() {
  const { has } = useAccess(); const [configuring, setConfiguring] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { asOf: new Date() } });
  const asOf = useWatch({ control: form.control, name: "asOf" });
  const args = { ...financeAudit, subModule: "Cashflow reports", asOf: asOf instanceof Date && Number.isFinite(asOf.getTime()) ? dayEndUtc(asOf) : "" };
  const options = { skip: !args.asOf };
  const summary = financeApi.useGetApiV1PaymentsCashflowSummaryQuery(args, options);
  const ap = financeApi.useGetApiV1PaymentsApAgingQuery(args, options);
  const ar = financeApi.useGetApiV1PaymentsArAgingQuery(args, options);
  const rates = financeApi.useGetApiV1PaymentsCurrencyConfigurationQuery(args, options);
  const warnings = [...new Set([...(summary.currentData?.dataQualityWarnings ?? []), ...(ap.currentData?.dataQualityWarnings ?? []), ...(ar.currentData?.dataQualityWarnings ?? [])])];
  const sections = [{ id: "summary", title: "Cashflow summary", query: summary }, { id: "ap", title: "Accounts payable aging", query: ap }, { id: "ar", title: "Accounts receivable aging", query: ar }, { id: "rates", title: "Exchange rates", query: rates }];
  return <article className="space-y-5"><PageHeader title="Cashflow" crumbs={[{ label: "Finance" }, { label: "Cashflow" }]} actions={<PaymentToolbar />} />
    <div className="flex flex-wrap items-end gap-3"><FormWizard form={form} fields={fields} />{has(financePermissions.record) ? <Button variant="outline" onClick={() => setConfiguring(true)}>Currency setup</Button> : null}</div>
    {warnings.length ? <section role="status" className="space-y-1 rounded-md border p-3"><h2 className="font-semibold">Data quality warnings</h2><ul className="list-disc pl-5">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section> : null}
    {sections.map(({ id, title, query }) => <section key={id} aria-label={title} className="space-y-3">
      {query.isLoading || (query.isFetching && !query.currentData) ? <><h2 className="font-semibold">{title}</h2><Skeleton className="h-40 w-full" /></> : query.error ? <div role="alert"><h2 className="font-semibold">{title} unavailable</h2><p>{apiErrorMessage(query.error)}</p><Button variant="outline" size="sm" onClick={() => void query.refetch()}>Retry {title.toLowerCase()}</Button></div>
        : id === "summary" && summary.currentData ? <CashflowSummary inflows={summary.currentData.projectedInflows} outflows={summary.currentData.projectedOutflows} currency={summary.currentData.baseCurrencyName ?? "Base currency not recorded"} />
        : id === "ap" && ap.currentData ? <AgingTable title={title} report={ap.currentData} />
        : id === "ar" && ar.currentData ? <AgingTable title={title} report={ar.currentData} />
        : id === "rates" && rates.currentData ? <ExchangeRates configuration={rates.currentData} /> : <p role="status">{args.asOf ? `No ${title.toLowerCase()} returned.` : "Choose a valid as of date."}</p>}
    </section>)}
    {configuring ? <Suspense fallback={<p role="status">Loading currency configuration…</p>}><CurrencyDialog onClose={() => setConfiguring(false)} /></Suspense> : null}
  </article>;
}
