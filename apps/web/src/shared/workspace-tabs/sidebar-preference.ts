const key = "oryx.workspace.sidebar-open";

/** A layout preference only; storage can be unavailable, so it always falls back to open. */
export function readSidebarPreference(): boolean {
  try { return window.localStorage.getItem(key) !== "false"; } catch { return true; }
}

export function writeSidebarPreference(open: boolean): void {
  try { window.localStorage.setItem(key, String(open)); } catch { /* preference only */ }
}

/** Shortcuts must not steal keys such as Ctrl+B (bold) from text fields and editors. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
