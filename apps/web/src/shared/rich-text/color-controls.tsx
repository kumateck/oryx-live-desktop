import { useEditorState, type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function hexColor(value: string): string { return /^#[0-9a-f]{6}$/i.test(value) ? value : "#1a1c1f"; }

export function ColorControls({ editor }: { editor: Editor }) {
  const colors = useEditorState({ editor, selector: ({ editor: current }) => ({
    text: String(current.getAttributes("textStyle").color ?? ""),
    highlight: String(current.getAttributes("highlight").color ?? "#fff2ad"),
  }) });
  return <>
    <label className="flex h-8 items-center gap-1 px-1 text-xs" title="Text color">A
      <Input type="color" aria-label="Text color" value={hexColor(colors.text ?? "")}
        onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        className="size-6 cursor-pointer border-0 bg-transparent p-0" />
    </label>
    <Button type="button" size="xs" variant="ghost" title="Reset text color" onClick={() => editor.chain().focus().unsetColor().run()}>Reset</Button>
    <label className="flex h-8 items-center gap-1 px-1 text-xs" title="Highlight color">Highlight
      <Input type="color" aria-label="Highlight color" value={hexColor(colors.highlight ?? "#fff2ad")}
        onChange={(event) => editor.chain().focus().setHighlight({ color: event.target.value }).run()}
        className="size-6 cursor-pointer border-0 bg-transparent p-0" />
    </label>
    <Button type="button" size="xs" variant="ghost" title="Remove highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>Clear</Button>
  </>;
}
