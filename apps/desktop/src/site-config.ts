export function parseSiteUrl(input: string): string {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error("Enter a complete server address, such as https://192.0.2.10"); }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Enter an HTTP or HTTPS address for your Oryx web application.");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Enter only the server origin, without a path, account, query, or fragment.");
  }
  return url.origin;
}
