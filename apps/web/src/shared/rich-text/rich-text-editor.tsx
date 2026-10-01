import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { RichTextReference } from "@/shared/forms/form-wizard-types";
import { EditorToolbar } from "./editor-toolbar";
import { editorExtensions } from "./editor-extensions";
import "./rich-text.css";

interface RichTextEditorProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string | undefined;
  rows?: number | undefined;
  disabled?: boolean | undefined;
  invalid?: boolean;
  describedBy?: string | undefined;
  references?: readonly RichTextReference[] | undefined;
}

const emptyReferences: readonly RichTextReference[] = [];

export function RichTextEditor({ id, label, value, onChange, onBlur, placeholder = "Write here…", rows = 4,
  disabled = false, invalid = false, describedBy, references = emptyReferences }: RichTextEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  const lastEmitted = useRef(value ?? "");
  const extensions = useMemo(() => editorExtensions(placeholder), [placeholder]);
  useEffect(() => { onChangeRef.current = onChange; onBlurRef.current = onBlur; }, [onChange, onBlur]);
  const editor = useEditor({
    extensions,
    content: value ?? "",
    editable: !disabled,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: { attributes: { id, role: "textbox", "aria-label": label, "aria-multiline": "true", class: "oryx-rich-content" } },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? "" : current.getHTML();
      lastEmitted.current = html;
      onChangeRef.current(html);
    },
    onBlur: () => onBlurRef.current(),
  }, [extensions]);
  useEffect(() => {
    if (!editor || (value ?? "") === lastEmitted.current) return;
    editor.commands.setContent(value ?? "", { emitUpdate: false });
    lastEmitted.current = value ?? "";
  }, [editor, value]);
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    const element = editor.view.dom;
    element.setAttribute("aria-invalid", String(invalid));
    element.setAttribute("aria-disabled", String(disabled));
    if (describedBy) element.setAttribute("aria-describedby", describedBy);
    else element.removeAttribute("aria-describedby");
  }, [editor, invalid, disabled, describedBy]);
  const panel = (isExpanded: boolean) => <div className="oryx-rich-text flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-input bg-background dark:bg-input/30"
    data-invalid={invalid}>
    {editor && !disabled ? <EditorToolbar editor={editor} references={references} expanded={isExpanded} onExpand={() => setExpanded(true)} /> : null}
    <EditorContent editor={editor} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
      style={{ minHeight: isExpanded ? undefined : Math.max(3, rows) * 26 }} />
  </div>;
  return <>
    {!expanded ? panel(false) : null}
    <Dialog open={expanded} onOpenChange={setExpanded}>
      {expanded ? <DialogContent className="flex h-[min(90vh,900px)] w-[min(96vw,1000px)] max-w-none flex-col overflow-hidden p-3" aria-describedby={undefined}>
        <DialogTitle className="shrink-0 pr-10">{label}</DialogTitle>
        {panel(true)}
      </DialogContent> : null}
    </Dialog>
  </>;
}
