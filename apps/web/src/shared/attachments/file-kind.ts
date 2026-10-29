import { unzipSync } from "fflate";
import type { DocumentFormat } from "./engines";

/** How the viewer shows a file. Document formats go to the read-only craft engines. */
export type FileKind = DocumentFormat | "image" | "csv" | "json" | "text" | "audio" | "video" | "office-legacy" | "office-other" | "archive" | "unknown";

const byExtension: Record<string, FileKind> = {
  pdf: "pdf", docx: "docx", xlsx: "xlsx",
  png: "image", jpg: "image", jpeg: "image", jfif: "image", webp: "image", gif: "image", bmp: "image", svg: "image", avif: "image", ico: "image", tif: "image", tiff: "image", heic: "image",
  csv: "csv", tsv: "csv", json: "json",
  txt: "text", log: "text", md: "text", xml: "text", html: "text", htm: "text", yml: "text", yaml: "text", ini: "text", rtf: "text",
  mp3: "audio", wav: "audio", ogg: "audio", oga: "audio", m4a: "audio", aac: "audio", flac: "audio", opus: "audio",
  mp4: "video", m4v: "video", webm: "video", mov: "video", ogv: "video",
  doc: "office-legacy", xls: "office-legacy", ppt: "office-legacy",
  pptx: "office-other", odt: "office-other", ods: "office-other", odp: "office-other", docm: "office-other", xlsm: "office-other",
  zip: "archive", rar: "archive", "7z": "archive", gz: "archive", tar: "archive",
};

export const fileExtension = (name: string) => /\.([a-z0-9]+)$/i.exec(name.trim())?.[1]?.toLowerCase() ?? "";
export const kindFromName = (name: string): FileKind => byExtension[fileExtension(name)] ?? "unknown";

export function kindFromMime(mime: string | null | undefined): FileKind {
  const type = (mime ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!type || type === "application/octet-stream") return "unknown";
  if (type === "application/pdf") return "pdf";
  if (type.endsWith("wordprocessingml.document")) return "docx";
  if (type.endsWith("spreadsheetml.sheet")) return "xlsx";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("video/")) return "video";
  if (type === "text/csv" || type === "text/tab-separated-values") return "csv";
  if (type === "application/json" || type.endsWith("+json")) return "json";
  if (type.startsWith("text/") || type === "application/xml") return "text";
  if (type === "application/msword" || type === "application/vnd.ms-excel" || type === "application/vnd.ms-powerpoint") return "office-legacy";
  if (/zip|rar|7z|gzip|tar/.test(type)) return "archive";
  return "unknown";
}

const starts = (bytes: Uint8Array, signature: readonly number[], at = 0) => signature.every((value, index) => bytes[at + index] === value);
const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

/** Reads the file's own signature. Null means the bytes do not say, so the name or server type decides. */
export function sniffKind(bytes: Uint8Array): FileKind | null {
  if (bytes.length === 0) return null;
  const head = ascii(bytes, 0, Math.min(bytes.length, 1024));
  if (head.includes("%PDF-")) return "pdf";
  if (starts(bytes, [0x50, 0x4b, 0x03, 0x04])) return zipKind(bytes);
  if (starts(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "office-legacy";
  if (starts(bytes, [0x89, 0x50, 0x4e, 0x47]) || starts(bytes, [0xff, 0xd8, 0xff]) || head.startsWith("GIF8") || (starts(bytes, [0x42, 0x4d]) && starts(bytes, [0, 0, 0, 0], 6))
    || starts(bytes, [0x00, 0x00, 0x01, 0x00]) || (head.startsWith("RIFF") && ascii(bytes, 8, 12) === "WEBP")
    || starts(bytes, [0x49, 0x49, 0x2a, 0x00]) || starts(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return "image";
  const brand = ascii(bytes, 4, 12);
  if (brand.startsWith("ftyp")) {
    const kind = brand.slice(4);
    if (/^(avif|avis|heic|heix|mif1|msf1)/.test(kind)) return "image";
    if (/^(M4A |M4B )/.test(kind)) return "audio";
    return "video";
  }
  if (starts(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "video";
  if (head.startsWith("RIFF") && ascii(bytes, 8, 12) === "WAVE") return "audio";
  if (head.startsWith("OggS") || head.startsWith("ID3") || head.startsWith("fLaC") || starts(bytes, [0xff, 0xfb]) || starts(bytes, [0xff, 0xf3])) return "audio";
  if (head.startsWith("Rar!") || starts(bytes, [0x37, 0x7a, 0xbc, 0xaf]) || starts(bytes, [0x1f, 0x8b])) return "archive";
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) return "image";
  return isText(bytes) ? "text" : null;
}

/** A Word or Excel file is a zip with a known main part; read only the file list, never the contents. */
function zipKind(bytes: Uint8Array): FileKind {
  const names: string[] = [];
  try { unzipSync(bytes, { filter: (file) => { names.push(file.name); return false; } }); } catch { return "archive"; }
  if (names.includes("word/document.xml")) return "docx";
  if (names.includes("xl/workbook.xml")) return "xlsx";
  if (names.some((name) => name.startsWith("ppt/")) || names.includes("mimetype")) return "office-other";
  return "archive";
}

function isText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 64 * 1024);
  if (sample.includes(0)) return false;
  try { new TextDecoder("utf-8", { fatal: true }).decode(sample, { stream: true }); return true; } catch { return false; }
}

/** Bytes win when they are recognisable; otherwise the extension, then the server's type. Text is refined by name. */
export function detectKind(name: string, mime: string | null | undefined, bytes: Uint8Array): FileKind {
  const sniffed = sniffKind(bytes);
  const named = kindFromName(name);
  const served = kindFromMime(mime);
  if (sniffed === "text") {
    if (named === "csv" || named === "json" || served === "csv" || served === "json") return named === "csv" || named === "json" ? named : served;
    if (named === "image" || served === "image") return /<svg[\s>]/i.test(ascii(bytes, 0, Math.min(bytes.length, 4096))) ? "image" : "text";
    const trimmed = ascii(bytes, 0, Math.min(bytes.length, 64)).trimStart();
    return trimmed.startsWith("{") || trimmed.startsWith("[") ? "json" : "text";
  }
  return sniffed ?? (named !== "unknown" ? named : served);
}

const labels: Record<FileKind, string> = {
  pdf: "PDF document", docx: "Word document", xlsx: "Excel workbook", image: "Image", csv: "Spreadsheet (CSV)", json: "JSON data",
  text: "Text file", audio: "Audio", video: "Video", "office-legacy": "Older Office file", "office-other": "Office file", archive: "Compressed archive", unknown: "File",
};
export const fileKindLabel = (kind: FileKind) => labels[kind];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}
