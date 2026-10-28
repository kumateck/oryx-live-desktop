import { useParams } from "react-router";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { batchPath, grnDetailPath, qcPermissions } from "../lib/qc-grn";

/** The note, batch and material kind a batch page is about, and the links back. */
export function useBatchRoute() {
  const { id = "", batchId = "" } = useParams();
  const { kind } = useKindTabs(qcPermissions.view);
  const k = kind ?? 0;
  return { grnId: id, batchId, kind: k, ready: Boolean(id && batchId && kind !== null), notePath: grnDetailPath(id, k), path: (step: "" | "assign" | "reassign" | "test" = "") => batchPath(id, batchId, k, step) };
}
