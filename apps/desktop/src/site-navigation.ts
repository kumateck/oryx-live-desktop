/** Whether this top-level address belongs to the connected customer's web application. */
export function isSitePage(siteOrigin: string, address: string): boolean {
  if (!siteOrigin) return false;
  try {
    const url = new URL(address);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === siteOrigin && !url.username && !url.password;
  } catch { return false; }
}

/** Reconnecting an open page reloads its full URL, including filters and fragments. */
export function reconnectSite(siteOrigin: string, page: { getURL(): string; reload(): void }, openSite: () => void): void {
  if (isSitePage(siteOrigin, page.getURL())) page.reload();
  else openSite();
}
