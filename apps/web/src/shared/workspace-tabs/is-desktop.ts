/** Existing isolated preload capability, never a URL flag or a user-agent guess. Not an access guard. */
export function isDesktopRenderer(): boolean {
  return typeof window.oryxSession?.load === "function" && typeof window.oryxSession.save === "function";
}
