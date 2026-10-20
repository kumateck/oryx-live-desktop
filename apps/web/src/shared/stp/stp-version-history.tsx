import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu } from "@/shared/actions";
import { formatDateTime } from "@/shared/format/dates";
import { signatureLabel, versionSourceLabel, type StpDocument } from "./stp-document";
import { AttachmentOpener } from "@/shared/attachments/attachment-opener";
import { useVersionFile, versionFileName } from "./use-version-file";

const cell = "border-b px-3 py-2 align-top text-sm";

/** Every version of the document, newest first, with signatures and access to its file. */
export function StpVersionHistory({ document }: { document: StpDocument }) {
  const { read, save, busy } = useVersionFile(document.id);
  if (document.versions.length === 0) return <p className="text-sm text-muted-foreground">No versions recorded yet.</p>;
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
      <td className={`${cell} text-right`}><div className="flex items-center justify-end gap-2">
        <AttachmentOpener file={{ id: version.id, name: versionFileName(version), link: null, read: (signal) => read(version, signal) }} />
        <TableMenu label={`Actions for version ${String(version.versionNumber)}`} items={[{ id: "download", label: "Download", icon: Download,
          disabled: busy !== null, onSelect: () => void save(version) }]} /></div></td>
    </tr>)}</tbody>
  </table></div>;
}
