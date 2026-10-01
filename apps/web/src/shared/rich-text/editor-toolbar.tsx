import type { Editor } from "@tiptap/react";
import { Maximize2 } from "lucide-react";
import type { RichTextReference } from "@/shared/forms/form-wizard-types";
import { ToolbarButton } from "./toolbar-button";
import { FormatControls } from "./format-controls";
import { HeadingMenu, AlignMenu, FontSizeMenu, TableMenu } from "./toolbar-menus";
import { LinkPopover } from "./link-popover";
import { ColorControls } from "./color-controls";
import { ReferenceMenu } from "./reference-menu";

interface EditorToolbarProps {
  editor: Editor;
  references: readonly RichTextReference[];
  onExpand: () => void;
  expanded: boolean;
}

export function EditorToolbar({ editor, references, onExpand, expanded }: EditorToolbarProps) {
  return <div role="toolbar" aria-label="Rich text formatting" className="flex min-w-0 flex-wrap items-center gap-0.5 border-b border-border px-1 py-1">
    <FormatControls editor={editor} />
    <HeadingMenu editor={editor} />
    <AlignMenu editor={editor} />
    <FontSizeMenu editor={editor} />
    <LinkPopover editor={editor} />
    <ColorControls editor={editor} />
    <TableMenu editor={editor} />
    <ReferenceMenu editor={editor} references={references} />
    {!expanded ? <ToolbarButton label="Expand editor" icon={<Maximize2 className="size-4" />} onClick={onExpand} /> : null}
  </div>;
}
