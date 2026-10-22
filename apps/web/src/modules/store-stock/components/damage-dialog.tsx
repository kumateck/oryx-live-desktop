import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { itemSchema, type InventoryItem } from "@/shared/inventory/contracts";
import { FormPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { stockAudit as audit, type StockReceipt } from "../schemas/stock";
import { DamageKind } from "../schemas/stock";
import { useDamageReport, damageValues, type DamageValues } from "../hooks/use-damage-report";
function Editor({ initial, kind, close }: { initial: InventoryItem; kind: DamageKind; close: () => void }) {
  const [original] = useState(() => structuredClone(initial));
  const command = useDamageReport(original, kind, close);
  const form = useForm<DamageValues>({ resolver: zodResolver(damageValues), defaultValues: { quantity: 0, remarks: "" } });
  const fields: WizardField<DamageValues>[] = [
    {
      type: I.NUMBER,
      name: "quantity",
      label: kind === DamageKind.Damaged ? "Quantity damaged" : "Quantity missing",
      required: true,
      min: 1,
      max: original.availableQuantity,
      step: 1,
    },
    { type: I.TEXTAREA, name: "remarks", label: "Remarks", rows: 4 },
  ];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kind === DamageKind.Damaged ? "Report damaged stock" : "Report missing stock"}</DialogTitle>
          <DialogDescription>
            {original.name} ({original.code}). Available: {original.availableQuantity} {original.unitOfMeasure.symbol}. Saving reduces available stock and posts
            a ledger debit.
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={form.handleSubmit(command.run)}>
          <DialogBody>
            <fieldset disabled={command.busy || !command.allowed}>
              <FormWizard form={form} fields={fields} />
            </fieldset>
            {command.error ? (
              <p role="alert" className="text-destructive">
                {command.error}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={command.busy} onClick={close}>
              Close
            </Button>
            <Button disabled={command.busy || !command.allowed}>{command.busy ? "Recording…" : "Record stock report"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function DamageDialog({ receipt, kind, close }: { receipt: StockReceipt; kind: DamageKind; close: () => void }) {
  const query = inventoryApi.useGetApiV1ItemsByIdQuery({ ...audit, id: receipt.itemId });
  const parsed = itemSchema.safeParse(query.currentData);
  if (query.isLoading)
    return (
      <Dialog open onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load current stock</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <FormPageSkeleton label="Loading current stock" sections={[2]} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  if (query.error || !parsed.success || parsed.data.id !== receipt.itemId || parsed.data.store !== receipt.item.store)
    return (
      <Dialog open onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock unavailable</DialogTitle>
            <DialogDescription>Current stock could not be verified. Close and retry from the register.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={close}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return <Editor initial={parsed.data} kind={kind} close={close} />;
}
