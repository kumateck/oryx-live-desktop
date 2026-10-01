import type { StpDocument } from "../schemas/stp-schema";

/** Where a controlled document is in its review. The numbers are the backend's. */
export const documentStatus = { draft: 0, inReview: 1, approved: 2, reviewed: 3 } as const;
const statusLabels = ["Draft", "In review", "Approved", "Reviewed"] as const;
export function documentStatusLabel(status: number): string { return statusLabels[status] ?? "Unknown"; }

/** A document being reviewed, or reviewed and awaiting approval, cannot be replaced. */
export function documentLocked(status: number | null): boolean {
  return status === documentStatus.inReview || status === documentStatus.reviewed;
}

/** Why the chosen file (or the lack of one) cannot be saved, or null when it can. */
export function documentProblem({ file, document, reasonForChange }: { file: File | null; document: StpDocument | null; reasonForChange: string }): string | null {
  if (!document && !file) return "Attach the STP as a .docx file";
  if (!file) return null;
  if (documentLocked(document?.status ?? null)) return "A document under review cannot be replaced";
  if (document?.status === documentStatus.approved && !reasonForChange.trim()) return "reason";
  return null;
}

/** The newest version of a document, which is the one a reader would open. */
export function latestVersion(document: StpDocument | null) {
  return document?.versions.reduce<StpDocument["versions"][number] | null>((latest, version) =>
    !latest || (version.versionNumber ?? 0) > (latest.versionNumber ?? 0) ? version : latest, null) ?? null;
}

export const stpNumbering = { modelType: "ProductSTPNumber", prefix: "QCD/STP/FP" } as const;
/** The next product STP number: the prefix and a three-digit serial, one more than the STPs that exist. */
export function nextStpNumber(existingCount: number): string {
  return `${stpNumbering.prefix}/${String(Math.max(0, Math.trunc(existingCount) || 0) + 1).padStart(3, "0")}`;
}
