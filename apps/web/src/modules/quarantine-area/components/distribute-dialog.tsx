import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { useDistribution } from "../hooks/use-distribution";
import { approvedMaterials, distributionPlan } from "../lib/distribution-plan";
import { distributionFormSchema, type DistributionFormValues, type Grn } from "../schemas/grn-schema";
import { DistributionPlanView } from "./distribution-plan-view";


export default function DistributeDialog({ grn, kind, onClose }: { grn: Grn; kind: MaterialKind; onClose: () => void }) {
  const options = approvedMaterials(grn, kind);
  const form = useForm<DistributionFormValues>({ resolver: zodResolver(distributionFormSchema), defaultValues: { material: options.length === 1 ? options[0] ?? null : null } });
  const material = useWatch({ control: form.control, name: "material" });
  const action = useDistribution(grn, kind, onClose);
  const fields: WizardField<DistributionFormValues>[] = [{ type: InputTypes.SELECT, name: "material", label: "Approved material", required: true,
    mode: "single", source: "sync", options, disabled: action.busy !== null, placeholder: "Select approved material" }];
  const plan = material ? distributionPlan(grn, material.value, kind) : null;

  return <Dialog open onOpenChange={(open) => { if (!open && action.busy === null) onClose(); }}>
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader><DialogTitle>Distribute approved material</DialogTitle>
        <DialogDescription>GRN {grn.number}. Review the batches and quantities for each warehouse. Stock is checked again before distribution.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-4">
        <FormWizard form={form} fields={fields} />
        {plan ? <DistributionPlanView plan={plan} busy={action.busy} onDistribute={(warehouse) => {
          void form.handleSubmit((values) => values.material ? action.submit(values.material.value, warehouse) : undefined)();
        }} /> : <p className="text-sm text-muted-foreground">Choose an approved material to see its warehouse distribution plan.</p>}
        {action.message && action.message !== plan?.problem ? <p role="alert" className="text-sm text-destructive">{action.message}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={action.busy !== null} onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
