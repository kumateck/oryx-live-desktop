import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { signatureLabel, versionSourceLabel, type StpDocument } from "./stp-document";
import { stpDocumentExtraApi } from "./stp-document-api";

const cell = "border-b px-3 py-2 align-top text-sm";

/** Every version of the document, newest first, with who signed it and a download of its file. */
export function StpVersionHistory({ document }: { document: StpDocument }) {
  const [download] = stpDocumentExtraApi.useDownloadStpDocumentVersionMutation();
  const [busy, setBusy] = useState<string | null>(null);
  if (document.versions.length === 0) return <p className="text-sm text-muted-foreground">No versions recorded yet.</p>;
  const save = async (version: StpDocument["versions"][number]) => {
    setBusy(version.id);
    const result = await download({ documentId: document.id, versionId: version.id });
    setBusy(null);
    if ("error" in result) { toast.error(apiErrorMessage(result.error)); return; }
    const link = window.document.createElement("a");
    link.href = result.data;
    link.download = version.fileName ?? `stp-v${String(version.versionNumber)}.docx`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(result.data), 1000);
  };
  return <div className="overflow-x-auto"><table className="w-full min-w-[48rem] border-collapse">
    <thead className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground"><tr>
      <th className="border-b px-3 py-2">Version</th><th className="border-b px-3 py-2">Source</th><th className="border-b px-3 py-2">By</th><th className="border-b px-3 py-2">Created</th>
      <th className="border-b px-3 py-2">Reason for change</th><th className="border-b px-3 py-2">Signatures</th><th className="border-b px-3 py-2">State</th><th className="border-b px-3 py-2 text-right">File</th>
    </tr></thead>
    <tbody>{document.versions.map((version) => <tr key={version.id}>
      <td className={cell}>v{version.versionNumber}</td>
      <td className={cell}>{versionSourceLabel(version.source)}</td>
      <td className={cell}>{version.createdByName ?? "–"}</td>
      <td className={cell}>{formatDateTime(version.createdAt) ?? "–"}</td>
      <td className={cell}>{version.reasonForChange ?? "–"}</td>
      <td className={cell}>{version.signatures.length === 0 ? "–" : <ul className="space-y-1">{version.signatures.map((signature) => <li key={signature.id}>
        <span className="font-medium">{signatureLabel(signature.action)}</span> by {signature.createdByName ?? "someone"}{signature.createdAt ? `, ${formatDateTime(signature.createdAt) ?? ""}` : ""}
        {signature.meaning ? <span className="block text-xs text-muted-foreground">{signature.meaning}</span> : null}</li>)}</ul>}</td>
      <td className={cell}>{version.isEffective ? <Badge>In force</Badge> : version.isSuperseded ? <Badge variant="outline">Superseded</Badge> : <Badge variant="secondary">Draft</Badge>}</td>
      <td className={`${cell} text-right`}><Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void save(version)} aria-label={`Download version ${String(version.versionNumber)}`}>
        {busy === version.id ? <Spinner /> : <Download />}Download</Button></td>
    </tr>)}</tbody>
  </table></div>;
}
