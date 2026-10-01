export function parseSiteUrl(input: string, allowLocalHttp = false): string {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error("Enter a complete server address, such as https://192.0.2.10"); }

  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(allowLocalHttp && local && url.protocol === "http:")) {
    throw new Error("The customer server must use trusted HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Enter only the server origin, without a path, account, query, or fragment.");
  }
  return url.origin;
}
