import type { DocumentFormat } from "./engines";

export interface AttachedFile {
  id: string;
  name: string;
  link: string | null;
  /** Only supplied by local file selection or an authorized in-app read, never a URL from a record. */
  blob?: Blob;
  read?: (signal: AbortSignal) => Promise<Blob>;
}
export function safeFileLink(link: string | null): string | null {
  if (!link || !/^https?:\/\//i.test(link)) return null;
  try {
    const url = new URL(link);
    return url.username || url.password ? null : url.href;
  } catch { return null; }
}
const extension = (name: string) => /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? "";
export const isImageFile = (name: string) => ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(extension(name));
export function documentFormat(file: AttachedFile): DocumentFormat | null {
  const link = safeFileLink(file.link);
  const ext = extension(file.name) || (link ? extension(new URL(link).pathname) : "");
  return ext === "pdf" || ext === "docx" || ext === "xlsx" ? ext : null;
}
/** The existing backend file route streams MinIO bytes. Use the site's proxy to avoid mixed-content/CORS on its absolute links. */
export function attachmentAddress(link: string): string {
  const url = new URL(link);
  return /^\/api\/v1\/file\//.test(url.pathname) && !url.search && !url.hash ? url.pathname : url.href;
}
/** Matches the 20 MB upload limit, so anything that can be attached can also be viewed. */
export const attachmentLimit = 20 * 1024 * 1024;

export const canOpenAttachment = (file: AttachedFile) => Boolean(file.blob || file.read || safeFileLink(file.link));

/** File links embedded in rich text share the attachment flow; ordinary website links keep their navigation. */
export function attachmentFromLink(href: string, label: string, baseOrigin: string): AttachedFile | null {
  if (!href.trim() || href.startsWith("#") || href.startsWith("//")) return null;
  try {
    const url = new URL(href, baseOrigin);
    const link = safeFileLink(url.href);
    if (!link) return null;
    const ext = extension(url.pathname);
    const fileExtensions = new Set(["pdf", "docx", "xlsx", "doc", "xls", "csv", "tsv", "ppt", "pptx", "odt", "ods", "rtf", "txt", "json", "xml",
      "zip", "rar", "7z", "png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "tif", "tiff", "mp3", "wav", "mp4", "webm"]);
    if (!fileExtensions.has(ext) && !/^\/api\/v1\/file\//.test(url.pathname)) return null;
    const leaf = decodeURIComponent(url.pathname.split("/").at(-1) ?? "Attachment");
    const name = extension(label.trim()) ? label.trim() : ext ? leaf : label.trim() || leaf;
    return { id: link, name, link };
  } catch { return null; }
}
