import { createContext, useContext } from "react";
import { useParams } from "react-router";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { batchPath, grnDetailPath, qcGrnPath, qcPermissions } from "../lib/qc-grn";

export type BatchStep = "" | "assign" | "reassign" | "test" | "progress";

/**
 * Where a material batch test runs. On a goods receipt note the route comes from the address; a material retest,
 * which runs the same test like an analytical test request, provides its own (no note, its own pages and links back).
 */
export interface BatchRoute {
  /** The goods receipt note, or null when the test belongs to a retest. */
  grnId: string | null;
  batchId: string;
  kind: 0 | 1;
  ready: boolean;
  /** Where "back" goes: the note, or the retest. */
  notePath: string;
  backLabel: string;
  path: (step: BatchStep) => string;
  crumbs: readonly { label: string; to?: string }[];
  /** The sample's AR number and date when the page cannot read them from the note. */
  sampling?: { arNumber: string | null; sampleDate: string | null; /** The material test (sampling) id. */ id?: string | null | undefined } | undefined;
  /** Whether results were submitted, when the batch status cannot say (a retest batch stays held throughout). */
  submitted?: boolean | undefined;
}

export const BatchRouteContext = createContext<BatchRoute | null>(null);

/** The note, batch and material kind a batch page is about, and the links back. */
export function useBatchRoute(): BatchRoute {
  const provided = useContext(BatchRouteContext);
  const { id = "", batchId = "" } = useParams();
  const { kind } = useKindTabs(qcPermissions.view);
  if (provided) return provided;
  const k = kind ?? 0;
  const notePath = grnDetailPath(id, k);
  return { grnId: id, batchId, kind: k, ready: Boolean(id && batchId && kind !== null), notePath, backLabel: "Back to the note",
    path: (step) => batchPath(id, batchId, k, step),
    crumbs: [{ label: "Goods receipt notes", to: `${qcGrnPath}?type=${String(k)}` }, { label: "Note", to: notePath }] };
}
