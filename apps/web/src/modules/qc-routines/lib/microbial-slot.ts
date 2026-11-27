/** A specification's microbial template and number, which a new microbial ARD must use. */
export interface MicrobialSlot { form: { id: string; name: string }; specNumber: string | null }

/** Reads the microbial slot off a specification response; null when the specification names no microbial template. */
export function microbialSlotOf(spec: { specificationNumber?: string | null; microbialFormId?: string | null; microbialForm?: { id?: string | null; name?: string | null } | null } | null | undefined): MicrobialSlot | null {
  const id = spec?.microbialForm?.id ?? spec?.microbialFormId ?? null;
  if (!id) return null;
  return { form: { id, name: spec?.microbialForm?.name?.trim() || "Microbial template" }, specNumber: spec?.specificationNumber?.trim() || null };
}
