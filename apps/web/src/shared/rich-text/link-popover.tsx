import { useId, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { isSafeEditorLink } from "./link-url";

export function LinkPopover({ editor }: { editor: Editor }) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  const apply = () => {
    const value = href.trim();
    if (!isSafeEditorLink(value)) { setError("Enter an HTTP, HTTPS, mailto, or internal link."); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: value }).run();
    setOpen(false);
  };
  return <Popover open={open} onOpenChange={(next) => {
    setOpen(next);
    if (next) {
      const current = editor.getAttributes("link").href;
      setHref(typeof current === "string" ? current : "");
      setError("");
    }
  }}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" size="icon-sm" title="Link" aria-label="Link"
      onMouseDown={(event) => event.preventDefault()}><Link2 className="size-4" /></Button></PopoverTrigger>
    <PopoverContent align="start" className="w-72 space-y-2">
      <label htmlFor={inputId} className="text-xs font-medium">Link URL</label>
      <Input id={inputId} value={href} onChange={(event) => { setHref(event.target.value); setError(""); }}
        placeholder="https://example.com" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); apply(); } }} />
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!editor.isActive("link")}
          onClick={() => { editor.chain().focus().unsetLink().run(); setOpen(false); }}>Remove</Button>
        <Button type="button" size="sm" onClick={apply}>Apply</Button>
      </div>
    </PopoverContent>
  </Popover>;
}
