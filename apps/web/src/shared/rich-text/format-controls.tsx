import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, Redo2, Strikethrough, Underline, Undo2 } from "lucide-react";
import { ToolbarButton } from "./toolbar-button";

export function FormatControls({ editor }: { editor: Editor }) {
  const state = useEditorState({ editor, selector: ({ editor: current }) => ({
    bold: current.isActive("bold"), italic: current.isActive("italic"), underline: current.isActive("underline"),
    strike: current.isActive("strike"), bullet: current.isActive("bulletList"), ordered: current.isActive("orderedList"),
    undo: current.can().undo(), redo: current.can().redo(),
  }) });
  return <>
    <ToolbarButton label="Undo" icon={<Undo2 className="size-4" />} disabled={!state.undo} onClick={() => editor.chain().focus().undo().run()} />
    <ToolbarButton label="Redo" icon={<Redo2 className="size-4" />} disabled={!state.redo} onClick={() => editor.chain().focus().redo().run()} />
    <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
    <ToolbarButton label="Bold" icon={<Bold className="size-4" />} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
    <ToolbarButton label="Italic" icon={<Italic className="size-4" />} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
    <ToolbarButton label="Underline" icon={<Underline className="size-4" />} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
    <ToolbarButton label="Strikethrough" icon={<Strikethrough className="size-4" />} active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
    <span className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />
    <ToolbarButton label="Bullet list" icon={<List className="size-4" />} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
    <ToolbarButton label="Numbered list" icon={<ListOrdered className="size-4" />} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
  </>;
}
