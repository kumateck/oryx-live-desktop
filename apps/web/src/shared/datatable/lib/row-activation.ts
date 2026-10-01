const interactive = [
  "a[href]", "button", "input", "select", "textarea", "label", "summary", "[contenteditable='true']",
  "[role='button']", "[role='link']", "[role='menuitem']", "[role='checkbox']", "[role='switch']",
  "[role='combobox']", "[role='tab']", "[data-row-click='ignore']",
].join(",");

/**
 * Whether a click on a row should open it. A click is ignored when it lands on a control inside the
 * row, when it comes from a menu or dialog rendered outside the row (React forwards those events to
 * the row), when the user was selecting text, or when a modifier or non-primary button was used.
 */
export function opensRow(event: {
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean;
}): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const row = event.currentTarget;
  const target = event.target;
  if (!(row instanceof Element) || !(target instanceof Element) || !row.contains(target)) return false;
  const control = target.closest(interactive);
  if (control && control !== row && row.contains(control)) return false;
  const selection = typeof window === "undefined" ? null : window.getSelection();
  if (selection && !selection.isCollapsed && selection.toString().trim() && selection.anchorNode && row.contains(selection.anchorNode)) return false;
  return true;
}
