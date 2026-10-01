import type { Editor } from "@tiptap/react";
import { AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RichTextReference } from "@/shared/forms/form-wizard-types";

export function ReferenceMenu({ editor, references }: { editor: Editor; references: readonly RichTextReference[] }) {
  if (references.length === 0) return null;
  return <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="Insert reference" title="Insert reference">
    <AtSign className="size-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
      {references.map((reference) => <DropdownMenuItem key={`${reference.kind}:${reference.id}`} onSelect={() => {
        const node = reference.kind === "user" ? "oryxMention" : "oryxHashtag";
        editor.chain().focus().insertContent([{ type: node, attrs: { id: reference.id, label: reference.label } }, { type: "text", text: " " }]).run();
      }}>{reference.kind === "user" ? "@" : "#"}{reference.label}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
