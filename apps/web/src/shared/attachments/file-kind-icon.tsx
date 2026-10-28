import { File, FileArchive, FileAudio, FileCode, FileImage, FileSpreadsheet, FileText, FileVideo, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { FileKind } from "./file-kind";

const icons: Record<FileKind, LucideIcon> = {
  pdf: FileText, docx: FileText, xlsx: FileSpreadsheet, csv: FileSpreadsheet, image: FileImage, json: FileCode, text: FileText,
  audio: FileAudio, video: FileVideo, archive: FileArchive, "office-legacy": File, "office-other": File, unknown: File,
};
// A colour per family helps tell files apart in a list without reading every name.
const tones: Partial<Record<FileKind, string>> = {
  pdf: "text-red-600 dark:text-red-400", docx: "text-blue-600 dark:text-blue-400", xlsx: "text-emerald-600 dark:text-emerald-400",
  csv: "text-emerald-600 dark:text-emerald-400", image: "text-violet-600 dark:text-violet-400", video: "text-amber-600 dark:text-amber-400", audio: "text-amber-600 dark:text-amber-400",
};

export function FileKindIcon({ kind, className }: { kind: FileKind; className?: string }) {
  const Icon = icons[kind];
  return <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-md border bg-muted", className)}>
    <Icon className={cn("size-5", tones[kind] ?? "text-muted-foreground")} />
  </span>;
}
