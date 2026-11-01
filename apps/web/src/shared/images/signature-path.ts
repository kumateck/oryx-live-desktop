/** Only server signature paths are requested. A legacy HTTP host is never followed. */
export function signaturePath(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://oryx.invalid");
    if (!/^\/api\/v1\/file\/signature\/[a-z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return null;
    return url.pathname;
  } catch { return null; }
}
