import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useWatch, type Control } from "react-hook-form";
import { formatDate } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { freeTime } from "../lib/billing-rules";
import type { EditSheetValues } from "../schemas/billing-schema";

/** Any form that carries a billing sheet's own details. */
type WithDetails = FieldValues & EditSheetValues;

function detailFields(styles: readonly SelectOption[], loading: boolean): WizardField<EditSheetValues>[] {
  return [
    { type: InputTypes.TEXT, name: "code", label: "Billing sheet number", required: true },
    { type: InputTypes.TEXT, name: "billOfLading", label: "Bill of lading number", required: true },
    { type: InputTypes.DATE, name: "arrival", label: "Expected arrival", required: true },
    { type: InputTypes.NUMBER, name: "freeDays", label: "Free time (days)", min: 0, max: 365, step: 1, required: true, description: "How long the port stores the container without charge." },
    { type: InputTypes.TEXT, name: "containerNumber", label: "Container number", required: true },
    { type: InputTypes.NUMBER, name: "packages", label: "Number of packages", min: 1, step: 1, required: true },
    { type: InputTypes.SELECT, name: "packageStyle", label: "Packaging style", mode: "single", source: "sync", options: styles, placeholder: loading ? "Loading…" : "Select a style" },
    { type: InputTypes.TEXTAREA, name: "packageDescription", label: "Package description", rows: 2, className: "md:col-span-2" },
  ];
}

/** The fields a billing sheet is created and edited with, and the dates that follow from them. */
export function SheetDetailsFields<TValues extends WithDetails>({ form, styles, loading, numberField }: { form: UseFormReturn<TValues>; styles: readonly SelectOption[]; loading: boolean; numberField?: ReactNode }) {
  const own = form as unknown as UseFormReturn<EditSheetValues>;
  const [arrival, days] = useWatch({ control: own.control as Control<EditSheetValues>, name: ["arrival", "freeDays"] });
  const time = freeTime(arrival, days);
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    {numberField}
    <FormWizard form={own} fields={detailFields(styles, loading).filter((field) => !numberField || !("name" in field) || field.name !== "code")} className="md:grid-cols-2" />
    <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">{time
      ? <>Free time ends on <span className="font-medium">{formatDate(time.expiry.toISOString())}</span>; demurrage is charged from <span className="font-medium">{formatDate(time.demurrageStart.toISOString())}</span>.</>
      : "Enter the arrival date and the free days to see when free time ends and demurrage starts."}</p>
  </section>;
}
