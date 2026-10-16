import type { CoaItemBody } from "../api/routines-api";

type FormLike = { sections?: readonly { groupName?: string | null; description?: string | null; fields?: readonly { id?: string; description?: string | null; question?: { label?: string | null; reference?: string | null } | null }[] | null }[] | null } | null | undefined;

/**
 * One certificate row per worksheet field, none chosen yet. A microbial ARD starts each row from its test's group and
 * specification, as Oryx Next did; a routine ARD starts them blank.
 */
export function coaItemsFor(form: FormLike, fromSections: boolean): CoaItemBody[] {
  return (form?.sections ?? []).flatMap((section) => (section.fields ?? []).flatMap((field) => field.id ? [{
    formFieldId: field.id, includeOnCoa: false, displayLabel: field.question?.label?.trim() || field.description?.trim() || "",
    groupName: fromSections ? section.groupName?.trim() ?? "" : "", specificationText: fromSections ? (section.description ?? field.description ?? "").trim() : "",
    unit: "", reference: fromSections ? field.question?.reference?.trim() ?? "" : "", displayOrder: 0,
  }] : [])).map((item, displayOrder) => ({ ...item, displayOrder }));
}

/** Why the chosen rows cannot be saved, keyed by the row's position, plus an overall message. */
export function coaProblems(items: readonly CoaItemBody[]) {
  const rows = new Map<number, string>();
  items.forEach((item, index) => { if (item.includeOnCoa && (!item.displayLabel.trim() || !item.specificationText.trim())) rows.set(index, "A chosen row needs its certificate label and specification."); });
  const overall = items.some((item) => item.includeOnCoa) ? rows.size > 0 ? "Complete the chosen certificate rows." : null : "Choose at least one field for the certificate.";
  return { rows, overall };
}
