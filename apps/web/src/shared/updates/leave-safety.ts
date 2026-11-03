/** Ask the existing beforeunload guards without navigating or displaying a browser confirmation. */
export function hasUnsavedUpdateWork(): boolean {
  return !window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
}
