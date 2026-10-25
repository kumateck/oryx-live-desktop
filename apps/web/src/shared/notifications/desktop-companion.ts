import type { CompanionBridge, CompanionSummary } from "../../../../../shared/companion";
type AvailableBridge = Pick<CompanionBridge, "summary" | "onOpen" | "settings" | "command"> & Partial<Pick<CompanionBridge, "notify">>;
declare global { interface Window { oryxCompanion?: AvailableBridge } }
/** Optional presentation only: a shell failure must never interrupt notification workflows. */
export function publishCompanion(value: CompanionSummary): void {
  void window.oryxCompanion?.summary(value).catch(() => {});
}
export function onCompanionOpen(listener: (notificationId?: string, direct?: boolean, shipmentDocumentId?: string, type?: number | null) => void): () => void {
  return window.oryxCompanion?.onOpen(listener) ?? (() => {});
}

export async function showSystemAlert(title: string, body: string, id?: string): Promise<boolean> {
  try { return await window.oryxCompanion?.notify?.({ title: title.slice(0, 160), body: body.slice(0, 4000), ...(id ? { id } : {}) }) ?? false; }
  catch { return false; }
}
