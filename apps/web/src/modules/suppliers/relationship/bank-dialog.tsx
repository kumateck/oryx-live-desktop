import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { usePartnerCollections } from "@/shared/reference-data/use-partner-collections";
import { useCreateBankDetailMutation, useUpdateBankDetailMutation } from "./relationship-api";
import { bankSchema, type BankValues } from "./schemas";
import type { BankDetail } from "./types";

export function BankDialog({ supplierId, record, open, onOpenChange }: {
  supplierId: string; record?: BankDetail; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const collections = usePartnerCollections("currency");
  const [create, creating] = useCreateBankDetailMutation();
  const [update, updating] = useUpdateBankDetailMutation();
  const [error, setError] = useState("");
  const permission = usePermissionAction("CanManageSupplierContracts");
  const form = useForm<BankValues>({ resolver: zodResolver(bankSchema), defaultValues: {
    bankName: record?.bankName ?? "", accountNumber: record?.accountNumber ?? "", accountName: record?.accountName ?? "",
    swiftCode: record?.swiftCode ?? "", iban: record?.iban ?? "", branchAddress: record?.branchAddress ?? "",
    currency: record?.currency ? { value: record.currency.id, label: record.currency.name } : null,
  } });
  const fields = [
    { type: InputTypes.TEXT, name: "bankName", label: "Bank name", required: true },
    { type: InputTypes.TEXT, name: "accountName", label: "Account name", required: true },
    { type: InputTypes.TEXT, name: "accountNumber", label: "Account number", required: true },
    { type: InputTypes.SELECT, name: "currency", label: "Currency", mode: "single", source: "sync", options: collections.currencies, required: true },
    { type: InputTypes.TEXT, name: "swiftCode", label: "SWIFT code" },
    { type: InputTypes.TEXT, name: "iban", label: "IBAN" },
    { type: InputTypes.TEXTAREA, name: "branchAddress", label: "Branch address", className: "sm:col-span-2" },
  ] as const satisfies readonly WizardField<BankValues>[];
  const busy = creating.isLoading || updating.isLoading;
  const save = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    await form.handleSubmit(async (values) => {
      const denied = permission.check();
      if (denied) { setError(denied); return; }
      if (!values.currency) return;
      const body = { ...values, currencyId: values.currency.value };
      const result = record ? await update({ supplierId, id: record.id, body }) : await create({ supplierId, body });
      if ("error" in result) { setError(apiErrorMessage(result.error)); return; }
      toast.success(record ? "Bank details updated" : "Bank details added"); onOpenChange(false);
    })();
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-xl">
    <DialogHeader><DialogTitle>{record ? "Edit bank details" : "Add bank details"}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => void save(event)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><FormWizard form={form} fields={fields} className="sm:grid-cols-2" />
        {collections.error ? <p role="alert" className="mt-2 text-sm text-destructive">{collections.error} <Button type="button" size="xs" variant="link" onClick={collections.retry}>Retry</Button></p> : null}
        {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}</DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button type="submit" disabled={busy || !permission.allowed || collections.loading || Boolean(collections.error)}>{busy ? <><Spinner />Saving…</> : "Save bank details"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
