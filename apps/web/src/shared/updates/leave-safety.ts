/** Ask the existing beforeunload guards without navigating or displaying a browser confirmation. */
export function hasUnsavedUpdateWork(): boolean {
  return !window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
}
function visibleControl(element: HTMLElement): boolean {
  if (element.matches('input[type="hidden"]')) return false;
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = window.getComputedStyle(current);
    if (current.hidden || current.inert || current.getAttribute("aria-hidden") === "true" || style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
  }
  return true;
}
export function canApplyWebRelease(): boolean {
  const controls = document.querySelectorAll<HTMLElement>('form, textarea, input, [contenteditable="true"], [role="dialog"]');
  return document.visibilityState === "visible" && !Array.from(controls).some(visibleControl) && !hasUnsavedUpdateWork();
}
