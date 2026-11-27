import { stpRevisionKeys, type StpRevisionRoutes } from "@/shared/stp-content";
import { listPath } from "./product-stps";

export const revisionsPath = `${listPath}/revisions`;
const withQuery = (path: string, query: Record<string, string>) => `${path}?${new URLSearchParams(query).toString()}`;

export const productRevisionRoutes: StpRevisionRoutes = {
  list: (stpNumber) => stpNumber ? withQuery(revisionsPath, { stp: stpNumber }) : revisionsPath,
  detail: (id) => `${revisionsPath}/${id}`,
  draft: (id) => `${revisionsPath}/${id}/draft`,
  correct: (id) => `${revisionsPath}/${id}/edit`,
  create: (stpNumber) => withQuery(`${revisionsPath}/new`, { stp: stpNumber }),
  import: (stpNumber, stpId) => withQuery(`${revisionsPath}/import`, { stp: stpNumber, ...(stpId ? { from: stpId } : {}) }),
};

export const revisionKeys = stpRevisionKeys(2);
