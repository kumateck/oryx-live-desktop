import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { topUpLineSchema, type TopUpLineValues } from "../schemas/stock-top-up-schema";

const fields = [
  { type: InputTypes.TEXT, name: "materialCode", label: "Material code", required: true },
  { type: InputTypes.TEXT, name: "batchNumber", label: "Batch number", required: true },
  { type: InputTypes.TEXT, name: "unitSymbol", label: "Base UOM", required: true, description: "Use the material-department UOM, such as mg, ml or piece." },
  { type: InputTypes.TEXT, name: "quantity", label: "Quantity in selected weight / liquid units", inputMode: "decimal", required: true },
  { type: InputTypes.TEXT, name: "warehouseName", label: "Warehouse name", description: "Leave blank to resolve from the material and department." },
  { type: InputTypes.TEXT, name: "shelfName", label: "Shelf name or code", description: "Leave blank to use the first shelf; review it in the draft." },
  { type: InputTypes.MONTH, name: "manufactured", label: "Manufactured" },
  { type: InputTypes.MONTH, name: "expiry", label: "Expiry" },
  { type: InputTypes.TEXT, name: "grn", label: "GRN reference" },
  { type: InputTypes.TEXT, name: "arNumber", label: "AR number" },
] as const satisfies readonly WizardField<TopUpLineValues>[];

export function StockTopUpLineDialog({ initial, onSave, onClose }: {
  initial: TopUpLineValues; onSave: (line: TopUpLineValues) => void; onClose: () => void;
}) {
  const form = useForm<TopUpLineValues>({ resolver: zodResolver(topUpLineSchema), defaultValues: initial });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Top-up stock line</DialogTitle>
        <DialogDescription>Keep each batch and receipt reference separate. Adding a line does not save or post stock.</DialogDescription></DialogHeader>
      <form noValidate className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={form.handleSubmit(onSave)}>
        <DialogBody><FormWizard form={form} fields={fields} className="md:grid-cols-3" /></DialogBody>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Keep line</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
