/** Browser approval may be required. Keep the web form available if no handler is installed. */
export function launchDesktopPasswordReset(address: string): void {
  try { window.location.assign(address); } catch { /* The explicit link and browser form remain available. */ }
}
