/**
 * The tests a certificate of analysis shows. The server resolves each field's "Report on COA" (the template's choice,
 * overridden by the specification) and sends the fields left off as `coaHiddenFieldIds`. A section keeps only its
 * reported fields; a section with none is left off the certificate and out of its overall assessment.
 * The worksheet is not filtered: unreported tests are still performed and recorded there.
 */
export function coaSections<F extends { id?: string | null | undefined }, S extends { fields?: F[] | null | undefined }>(
  sections: readonly S[], hiddenFieldIds: readonly string[] | null | undefined,
): S[] {
  if (!hiddenFieldIds?.length) return [...sections];
  const hidden = new Set(hiddenFieldIds);
  return sections.flatMap((section) => {
    const fields = section.fields ?? [];
    const reported = fields.filter((field) => !field.id || !hidden.has(field.id));
    if (fields.length > 0 && reported.length === 0) return [];
    return [reported.length === fields.length ? section : { ...section, fields: reported }];
  });
}
