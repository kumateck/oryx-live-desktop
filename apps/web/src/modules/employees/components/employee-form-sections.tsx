import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { settingsApi } from "@/shared/api/generated/settings";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { employeeAudit } from "../lib/access";
import { Button } from "@/components/ui/button";
import type { EmployeeValues } from "../schemas/employee-schema";
import { contactFields, familyFields, personalFields, paymentFields } from "../lib/employee-fields";
import { ChildrenFields } from "./children-fields";
import { SiblingsFields } from "./siblings-fields";
import { EducationBackgroundFields } from "./educationBackground-fields";
import { EmploymentHistoryFields } from "./employmentHistory-fields";
const family = [{ name: "father", label: "Father" }, { name: "mother", label: "Mother" }, { name: "spouse", label: "Spouse" }] as const;
const contacts = [{ name: "emergencyContact", label: "Emergency contact" }, { name: "nextOfKin", label: "Next of kin" }] as const;
export interface NationalityChoices { options: readonly { value: string; label: string }[]; problem: string | null; retry: () => void }

/** Every employee field; the caller supplies the nationalities and which personal fields apply. */
export function EmployeeFormFields({ form, nationalities, personal = personalFields }: { form: UseFormReturn<EmployeeValues>; nationalities: NationalityChoices; personal?: readonly WizardField<EmployeeValues>[] }) {
  const nationality: WizardField<EmployeeValues>[] = useMemo(() => [{ type: InputTypes.SELECT, name: "nationality", label: "Nationality", mode: "single", source: "sync", options: [...nationalities.options] }], [nationalities.options]);
  return <div className="space-y-6">
    <section className="space-y-3"><h2 className="font-semibold">Personal and employment information</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><FormWizard form={form} fields={personal} /><FormWizard form={form} fields={nationality} /></div>
      {nationalities.problem ? <p role="alert">{nationalities.problem} <Button type="button" variant="outline" size="sm" onClick={nationalities.retry}>Retry nationalities</Button></p> : null}</section>
    {family.map((section) => <section key={section.name} className="space-y-3"><h2 className="font-semibold">{section.label}</h2><div className="grid gap-4 sm:grid-cols-2"><FormWizard form={form} fields={familyFields(section.name)} /></div></section>)}
    {contacts.map((section) => <section key={section.name} className="space-y-3"><h2 className="font-semibold">{section.label}</h2><div className="grid gap-4 sm:grid-cols-2"><FormWizard form={form} fields={contactFields(section.name)} /></div></section>)}
    <ChildrenFields form={form} /><SiblingsFields form={form} /><EducationBackgroundFields form={form} /><EmploymentHistoryFields form={form} />
    <section className="space-y-3"><h2 className="font-semibold">Payment information</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><FormWizard form={form} fields={paymentFields} /></div></section>
  </div>;
}

/** The employee form for signed-in HR staff. */
export function EmployeeFormSections({ form }: { form: UseFormReturn<EmployeeValues> }) {
  const collection = settingsApi.useGetApiV1CountriesQuery(employeeAudit);
  const options = useMemo(() => (collection.data ?? []).flatMap((row) => row.id && row.name ? [{ value: row.id, label: row.name }] : []), [collection.data]);
  return <EmployeeFormFields form={form} nationalities={{ options, problem: collection.error ? apiErrorMessage(collection.error) : null, retry: () => void collection.refetch() }} />;
}
