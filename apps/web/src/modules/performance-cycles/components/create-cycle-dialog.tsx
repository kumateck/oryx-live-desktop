import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { CycleType, cycleTypes } from "@/shared/performance/contracts";
import { useCycleCommand } from "../hooks/use-cycle-command";
export const cycleFormSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    type: z.object({ value: z.enum(["0", "1", "2"]), label: z.string() }).nullable(),
    from: z.date().nullable(),
    to: z.date().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.type) ctx.addIssue({ code: "custom", path: ["type"], message: "Choose a cycle type." });
    if (!v.from) ctx.addIssue({ code: "custom", path: ["from"], message: "Choose a start date." });
    if (!v.to || (v.from && v.to <= v.from)) ctx.addIssue({ code: "custom", path: ["to"], message: "Choose an end date after the start date." });
  });
type Values = z.infer<typeof cycleFormSchema>;
const fields: WizardField<Values>[] = [
  { type: I.TEXT, name: "name", label: "Cycle name", required: true },
  {
    type: I.SELECT,
    name: "type",
    label: "Cycle type",
    required: true,
    mode: "single",
    source: "sync",
    options: cycleTypes.map((label, value) => ({ label, value: String(value) })),
  },
  { type: I.DATE, name: "from", label: "Period starts", required: true },
  { type: I.DATE, name: "to", label: "Period ends", required: true },
];
const date = (v: Date) => `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}T00:00:00Z`;
export function CreateCycleDialog({ onClose }: { onClose: () => void }) {
  const command = useCycleCommand(onClose);
  const form = useForm<Values>({ resolver: zodResolver(cycleFormSchema), defaultValues: { name: "", type: null, from: null, to: null } });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !command.busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create performance cycle</DialogTitle>
          <DialogDescription>Create a draft cycle. Activation and closure require separate confirmation.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (!v.type || !v.from || !v.to) return;
            await command.run({
              kind: "create",
              body: {
                name: v.name,
                type: v.type.value === "0" ? CycleType.Annual : v.type.value === "1" ? CycleType.SemiAnnual : CycleType.Quarterly,
                periodStart: date(v.from),
                periodEnd: date(v.to),
              },
            });
          })}
        >
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
            <Button type="button" variant="outline" disabled={command.busy} onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={command.busy || !command.allowed}>{command.busy ? "Creating…" : "Create draft"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
