import { useState } from "react";

/** The document-control line printed on a controlled copy, such as the SOP annexure number and its revision. */
export interface DocumentControl { reference: string; revision: string; supersedes: string }
const empty: DocumentControl = { reference: "", revision: "", supersedes: "" };
const storageKey = (documentId: string) => `oryx.reports.document-control.${documentId}`;
const text = (value: unknown) => typeof value === "string" ? value.slice(0, 80) : "";

function read(documentId: string): DocumentControl {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey(documentId)) ?? "null");
    if (!stored || typeof stored !== "object") return empty;
    return { reference: text(Reflect.get(stored, "reference")), revision: text(Reflect.get(stored, "revision")), supersedes: text(Reflect.get(stored, "supersedes")) };
  } catch { return empty; }
}

/** Remembered on this computer so the next print carries the same reference until QA issues a new revision. */
export function useDocumentControl(documentId: string) {
  const [control, setControl] = useState(() => read(documentId));
  const update = (field: keyof DocumentControl, value: string) => setControl((current) => {
    const next = { ...current, [field]: value.slice(0, 80) };
    try { window.localStorage.setItem(storageKey(documentId), JSON.stringify(next)); } catch { /* kept for this visit */ }
    return next;
  });
  return { control, update };
}

/** "QAD/SOP/007/A03-06 · Revision 17 · Supersedes 16", leaving out the parts that are blank. */
export function documentControlLine(control: DocumentControl): string | null {
  const parts = [control.reference.trim(), control.revision.trim() ? `Revision ${control.revision.trim()}` : "", control.supersedes.trim() ? `Supersedes ${control.supersedes.trim()}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
