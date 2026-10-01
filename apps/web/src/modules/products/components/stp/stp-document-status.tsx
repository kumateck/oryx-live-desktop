import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/shared/format/dates";
import { documentLocked, documentStatusLabel, latestVersion } from "../../lib/stp";
import type { StpDocument } from "../../schemas/stp-schema";

/** What is currently attached to the STP, and whether it can be replaced. */
export function StpDocumentStatus({ document }: { document: StpDocument | null }) {
  if (!document) return <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No document is attached yet. The first file becomes version 1.</p>;
  const version = latestVersion(document);
  return <div className="space-y-2 rounded-md border p-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 break-words font-medium">{version?.fileName?.trim() || "Controlled document"}</span>
      {version?.versionNumber ? <span className="text-muted-foreground">version {version.versionNumber}</span> : null}
      <Badge variant={document.status === 2 ? "default" : "secondary"}>{documentStatusLabel(document.status)}</Badge>
    </div>
    {version?.createdAt ? <p className="text-xs text-muted-foreground">Added {formatDate(version.createdAt)}{version.createdByName ? ` by ${version.createdByName}` : ""}</p> : null}
    <p className="text-xs text-muted-foreground">{documentLocked(document.status)
      ? "The document is under review and cannot be replaced until the review is completed or rejected."
      : "Leave the file empty to keep this document. A new file is added as the next version; earlier versions are kept."}</p>
  </div>;
}
