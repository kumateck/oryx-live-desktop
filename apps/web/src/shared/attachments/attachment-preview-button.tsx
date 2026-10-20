import { AttachmentOpener } from "./attachment-opener";
import type { AttachedFile } from "./file-type";

/** Compact View action; file names use AttachmentOpener directly. */
export function AttachmentPreviewButton({ file }: { file: AttachedFile }) {
  return <AttachmentOpener file={file} action />;
}
