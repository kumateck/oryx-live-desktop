import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { formatUnitPrice } from "@/shared/procurement/price";
import type { AgreementChange } from "../lib/agreements";

const schema = z.object({ agreedDate: z.date({ message: "Choose the date the price was agreed" }) });
type Values = z.infer<typeof schema>;
const fields: WizardField<Values>[] = [{ type: InputTypes.DATE, name: "agreedDate", label: "Agreed from", required: true }];

/**
 * Asked after the prices are checked, when they differ from the supplier's standing agreements: record them for
 * this quotation only, or also propose them as the agreed prices from a date. Proposals go through approval.
 */
export function AgreementStep({ changes, currency, saving, message, onBack, onRecordOnly, onSubmit }: {
  changes: readonly AgreementChange[]; currency: string | null; saving: boolean; message: string; onBack: () => void; onRecordOnly: () => void; onSubmit: (agreedDate: Date) => void;
}) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { agreedDate: new Date() } });
  return <form noValidate onSubmit={(event) => { event.stopPropagation(); void form.handleSubmit((values) => onSubmit(values.agreedDate))(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
    <DialogBody className="space-y-4">
      <p className="text-sm">{changes.length === 1 ? "One quoted price differs" : `${changes.length} quoted prices differ`} from this supplier's standing price agreements.
        You can record the prices for this quotation only, or also propose them as the agreed prices. Proposals are reviewed by the agreement's approvers before they take effect.</p>
      <ul aria-label="Agreement changes" className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border p-3 text-sm">{changes.map(({ line, agreement }) => <li key={line.id} className="flex flex-wrap justify-between gap-x-4">
        <span className="font-medium">{line.materialName}</span>
        <span className="text-muted-foreground">{agreement ? formatUnitPrice(agreement.agreedPrice, currency, agreement.priceUoM) : "No agreement"} → {formatUnitPrice(line.price, currency, line.priceUnit)}</span></li>)}</ul>
      <FormWizard form={form} fields={fields} className="md:grid-cols-2" />
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
    </DialogBody>
    <DialogFooter>
      <Button type="button" variant="ghost" disabled={saving} onClick={onBack}>Back to prices</Button>
      <Button type="button" variant="outline" disabled={saving} onClick={onRecordOnly}>Record prices only</Button>
      <Button type="submit" disabled={saving}>{saving ? <><Spinner />Saving…</> : "Record and propose agreement changes"}</Button>
    </DialogFooter>
  </form>;
}
