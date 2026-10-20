import { AttachmentOpener } from "@/shared/attachments/attachment-opener";
import { useVersionFile, versionFileName, type VersionFile } from "./use-version-file";

/** Reuses the authenticated version transport in summaries and edit dialogs as well as version history. */
export function StpVersionFile({ documentId, version }: { documentId: string; version: VersionFile }) {
  const { read } = useVersionFile(documentId);
  return <AttachmentOpener file={{ id: version.id, name: versionFileName(version), link: null, read: (signal) => read(version, signal) }} />;
}
