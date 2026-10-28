import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { financeApi } from "../api/finance-api";
import { financeAudit, financePermissions } from "../lib/access";
import { dayStartUtc } from "../lib/payments";
import { baseSchema, rateSchema } from "../schemas/payment-schema";
export function CurrencyDialog({ onClose }: { onClose: () => void }) {
  const gate = usePermissionAction(financePermissions.record); const currencies = usePartnerCollections("currency");
  const [setBase, baseState] = financeApi.usePutApiV1PaymentsBaseCurrencyByCurrencyIdMutation();
  const [addRate, rateState] = financeApi.usePostApiV1PaymentsExchangeRatesMutation();
  const running = useRef(false);
  const [message, setMessage] = useState("");
  const base = useForm<z.infer<typeof baseSchema>>({ resolver: zodResolver(baseSchema), defaultValues: { currency: null } });
  const rate = useForm<z.infer<typeof rateSchema>>({ resolver: zodResolver(rateSchema), defaultValues: { currency: null, rate: Number.NaN, effectiveDate: new Date() } });
  const baseFields: WizardField<z.infer<typeof baseSchema>>[] = [{ type: InputTypes.SELECT, name: "currency", label: "Reporting base currency", mode: "single", source: "sync", options: currencies.currencies, required: true }];
  const rateFields: WizardField<z.infer<typeof rateSchema>>[] = [
    { type: InputTypes.SELECT, name: "currency", label: "Transaction currency", mode: "single", source: "sync", options: currencies.currencies, required: true },
    { type: InputTypes.NUMBER, name: "rate", label: "Rate to base", min: 0, required: true },
    { type: InputTypes.DATE, name: "effectiveDate", label: "Effective date", required: true },
  ];
  const busy = baseState.isLoading || rateState.isLoading;
  const saveBase = base.handleSubmit(async ({ currency }) => {
    if (running.current || busy || !currency) return; setMessage(""); const denied = gate.check(); if (denied) { setMessage(denied); return; }
    running.current = true;
    try {
    const result = await setBase({ ...financeAudit, subModule: "Currency configuration", currencyId: currency.value });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Reporting base currency updated");
    } finally { running.current = false; }
  });
  const saveRate = rate.handleSubmit(async (values) => {
    if (running.current || busy || !values.currency) return; setMessage(""); const denied = gate.check(); if (denied) { setMessage(denied); return; }
    running.current = true;
    try {
    const result = await addRate({ ...financeAudit, subModule: "Exchange rates", domainEntitiesCurrenciesCreateExchangeRateRequest: { currencyId: values.currency.value, rateToBase: values.rate, effectiveDate: dayStartUtc(values.effectiveDate) } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Effective-dated exchange rate saved"); rate.resetField("rate", { defaultValue: Number.NaN });
    } finally { running.current = false; }
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>Cashflow currency configuration</DialogTitle><DialogDescription>Choose the reporting currency and effective-dated conversion rates. Source transaction amounts are preserved.</DialogDescription></DialogHeader>
    <DialogBody className="space-y-6">
      <form noValidate onSubmit={saveBase} className="space-y-3"><fieldset disabled={busy || !gate.allowed}><FormWizard form={base} fields={baseFields} /></fieldset><Button disabled={busy || currencies.loading || !gate.allowed}>Set base currency</Button></form>
      <form noValidate onSubmit={saveRate} className="space-y-3 border-t pt-4"><h2 className="font-semibold">Add exchange rate</h2><fieldset disabled={busy || !gate.allowed}><FormWizard form={rate} fields={rateFields} /></fieldset><Button disabled={busy || currencies.loading || !gate.allowed}>Save exchange rate</Button></form>
      {currencies.error ? <p role="alert">{currencies.error} <Button variant="outline" size="sm" onClick={currencies.retry}>Retry currencies</Button></p> : null}
      {message ? <p role="alert" className="text-destructive">{message}</p> : null}
    </DialogBody><DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
