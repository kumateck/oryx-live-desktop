import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { stpRevisionKeys, type StpRevisionRoutes } from "@/shared/stp-content";
import { listPath } from "./material-stps";

export const revisionsPath = `${listPath}/revisions`;
const typed = (path: string, kind: MaterialKind, extra?: Record<string, string>) => {
  const params = new URLSearchParams({ type: String(kind), ...extra });
  return `${path}?${params.toString()}`;
};

/** A material revision's pages carry its kind in the address, like the material STP pages. */
export const materialRevisionRoutes = (kind: MaterialKind): StpRevisionRoutes => ({
  list: (stpNumber) => typed(revisionsPath, kind, stpNumber ? { stp: stpNumber } : undefined),
  detail: (id) => typed(`${revisionsPath}/${id}`, kind),
  draft: (id) => typed(`${revisionsPath}/${id}/draft`, kind),
  correct: (id) => typed(`${revisionsPath}/${id}/edit`, kind),
  create: (stpNumber) => typed(`${revisionsPath}/new`, kind, { stp: stpNumber }),
  import: (stpNumber, stpId) => typed(`${revisionsPath}/import`, kind, { stp: stpNumber, ...(stpId ? { from: stpId } : {}) }),
});

/** Each revision task's raw and packaging keys, for the kind tabs and the manifest. */
export const revisionKeys = { 0: stpRevisionKeys(0), 1: stpRevisionKeys(1) } as const;
export const revisionViewKeys: Record<MaterialKind, string> = { 0: revisionKeys[0].view, 1: revisionKeys[1].view };
