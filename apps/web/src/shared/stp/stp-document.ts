import { z } from "zod";

// The controlled Word document behind a standard test procedure: its review state, versions and signatures.

/** Where a document is in its review. The numbers are the backend's. */
export const DocumentStatus = { Draft: 0, InReview: 1, Approved: 2, Reviewed: 3 } as const;
const statusLabels: Record<number, string> = { 0: "Draft", 1: "In review", 2: "Approved", 3: "Reviewed" };
export const documentStatusLabel = (status: number) => statusLabels[status] ?? "Unknown";
const sourceLabels: Record<number, string> = { 0: "Upload", 1: "Created", 2: "Auto-save", 3: "Manual save" };
export const versionSourceLabel = (source: number | null) => source === null ? "–" : sourceLabels[source] ?? "Unknown";
const signatureLabels: Record<number, string> = { 0: "Reviewed", 1: "Approved", 2: "Rejected" };
export const signatureLabel = (action: number | null) => action === null ? "Signed" : signatureLabels[action] ?? "Signed";
/** The backend's owner types, which say which STP a document belongs to. */
export const StpOwner = { Material: "MaterialStandardTestProcedure", Product: "ProductStandardTestProcedure" } as const;
export type StpOwnerType = (typeof StpOwner)[keyof typeof StpOwner];

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const number = z.number().nullish().transform((value) => value ?? null);
const signatureSchema = z.object({ id: z.string(), action: number, meaning: text, createdByName: text, createdAt: text });
const versionSchema = z.object({
  id: z.string(), versionNumber: z.number().nullish().transform((value) => value ?? 0), fileName: text, source: number, reasonForChange: text,
  isSuperseded: z.boolean().nullish().transform((value) => value === true), isEffective: z.boolean().nullish().transform((value) => value === true),
  createdByName: text, createdAt: text, signatures: z.array(signatureSchema).nullish().transform((value) => value ?? []),
});
export type DocumentVersion = z.infer<typeof versionSchema>;
/** The endpoint answers with nothing when no document has been attached yet. */
export const stpDocumentSchema = z.object({
  id: z.string(), ownerType: text, ownerId: text, status: z.number().nullish().transform((value) => value ?? DocumentStatus.Draft),
  currentDraftVersionId: text, effectiveVersionId: text, lockedByName: text, lockedAt: text,
  versions: z.array(versionSchema).nullish().transform((value) => [...(value ?? [])].sort((a, b) => b.versionNumber - a.versionNumber)),
}).nullish().transform((value) => value ?? null);
export type StpDocument = NonNullable<z.infer<typeof stpDocumentSchema>>;

/** A document being reviewed, or reviewed and awaiting approval, cannot be replaced. */
export const documentLocked = (status: number | null | undefined) => status === DocumentStatus.InReview || status === DocumentStatus.Reviewed;

/** Why a chosen file (or the lack of one) cannot be saved with the STP, or null when it can. */
export function documentProblem({ file, document, reasonForChange }: { file: File | null; document: StpDocument | null; reasonForChange: string }): string | null {
  if (!document && !file) return "Attach the STP as a .docx file.";
  if (!file) return null;
  if (!file.name.toLowerCase().endsWith(".docx")) return "Choose a .docx file.";
  if (documentLocked(document?.status)) return "A document under review cannot be replaced.";
  if (document?.status === DocumentStatus.Approved && reasonForChange.trim().length < 3) return "Give the reason for the change; the approved version stays in force until the new one is approved.";
  return null;
}

/** "QCD/STP/RM/004": the series prefix and a three-digit serial. */
export const stpNumber = (prefix: string, serial: number) => `${prefix}/${String(serial).padStart(3, "0")}`;
/** Ids the create endpoint answered with: a list of mappings, one mapping, or a bare id, depending on the deployment. */
export function createdIds(response: unknown): string[] {
  const one = (value: unknown): string[] => {
    if (typeof value === "string") return value.trim() ? [value.trim()] : [];
    if (Array.isArray(value)) return value.flatMap(one);
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      return typeof record.stpId === "string" ? one(record.stpId) : typeof record.id === "string" ? one(record.id) : record.data !== undefined ? one(record.data) : [];
    }
    return [];
  };
  return [...new Set(one(response))];
}
