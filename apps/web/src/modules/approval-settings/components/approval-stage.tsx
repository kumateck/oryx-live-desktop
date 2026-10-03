import { useWatch, type UseFormReturn } from "react-hook-form";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import type { ApprovalValues } from "../schemas/approval-settings-schema";

export function ApprovalStage({ form, index, count, roles, users, disabled, move, remove }: {
  form: UseFormReturn<ApprovalValues>; index: number; count: number; roles: readonly SelectOption[]; users: readonly SelectOption[]; disabled: boolean;
  move: (from: number, to: number) => void; remove: (index: number) => void;
}) {
  const type = useWatch({ control: form.control, name: `stages.${index}.type` });
  const fields: WizardField<ApprovalValues>[] = [
    { type: InputTypes.RADIO, name: `stages.${index}.type`, label: "Approver type", options: [{ value: "Role", label: "Role" }, { value: "User", label: "User" }] },
    { type: InputTypes.SELECT, name: type === "Role" ? `stages.${index}.role` : `stages.${index}.user`, label: type === "Role" ? "Approver role" : "Approver user", source: "sync", mode: "single", options: type === "Role" ? roles : users, required: true, disabled },
    { type: InputTypes.CHECKBOX, name: `stages.${index}.required`, label: "Required approval" },
  ];
  return <section className="space-y-3 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">Stage {index + 1}</h3><div className="flex gap-1">
    <Button type="button" variant="ghost" size="icon" aria-label={`Move stage ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}><ArrowUp /></Button>
    <Button type="button" variant="ghost" size="icon" aria-label={`Move stage ${index + 1} down`} disabled={index === count - 1} onClick={() => move(index, index + 1)}><ArrowDown /></Button>
    <Button type="button" variant="ghost" size="icon" aria-label={`Remove stage ${index + 1}`} onClick={() => remove(index)}><Trash2 /></Button>
  </div></div><FormWizard form={form} fields={fields} /></section>;
}
