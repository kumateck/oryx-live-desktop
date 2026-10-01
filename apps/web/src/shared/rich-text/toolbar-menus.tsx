import { useId, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify, ChevronDown, Heading, Table2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

function MenuButton({ label, icon, ...props }: { label: string; icon: ReactNode } & ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" size="sm" aria-label={label} title={label} {...props}>
    {icon}<ChevronDown aria-hidden="true" className="size-3" />
  </Button>;
}

export function HeadingMenu({ editor }: { editor: Editor }) {
  const levels = [1, 2, 3, 4, 5, 6] as const;
  return <DropdownMenu><DropdownMenuTrigger asChild><MenuButton label="Heading style" icon={<Heading className="size-4" />} /></DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>Paragraph</DropdownMenuItem>
      {levels.map((level) => <DropdownMenuItem key={level} onSelect={() => editor.chain().focus().toggleHeading({ level }).run()}>
        Heading {level}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function AlignMenu({ editor }: { editor: Editor }) {
  const choices = [
    { value: "left", label: "Align left", icon: AlignLeft },
    { value: "center", label: "Align center", icon: AlignCenter },
    { value: "right", label: "Align right", icon: AlignRight },
    { value: "justify", label: "Justify", icon: AlignJustify },
  ] as const;
  return <DropdownMenu><DropdownMenuTrigger asChild><MenuButton label="Alignment" icon={<AlignLeft className="size-4" />} /></DropdownMenuTrigger>
    <DropdownMenuContent align="start">{choices.map((choice) => <DropdownMenuItem key={choice.value}
      onSelect={() => editor.chain().focus().setTextAlign(choice.value).run()}>
      <choice.icon className="size-4" />{choice.label}</DropdownMenuItem>)}</DropdownMenuContent>
  </DropdownMenu>;
}

export function FontSizeMenu({ editor }: { editor: Editor }) {
  const sizes = [12, 14, 16, 18, 24, 32] as const;
  return <DropdownMenu><DropdownMenuTrigger asChild><MenuButton label="Font size" icon={<Type className="size-4" />} /></DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem onSelect={() => editor.chain().focus().unsetFontSize().run()}>Default size</DropdownMenuItem>
      {sizes.map((size) => <DropdownMenuItem key={size} onSelect={() => editor.chain().focus().setFontSize(`${size}px`).run()}>
        {size} px</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function TableMenu({ editor }: { editor: Editor }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const rowsId = useId();
  const colsId = useId();
  const inTable = useEditorState({ editor, selector: ({ editor: current }) => current.isActive("table") });
  return <DropdownMenu><DropdownMenuTrigger asChild><MenuButton label="Table" icon={<Table2 className="size-4" />} /></DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-44">
      <div className="flex gap-2 p-2" onKeyDown={(event) => { if (event.key !== "Escape") event.stopPropagation(); }}>
        <label htmlFor={rowsId} className="flex min-w-0 flex-1 flex-col gap-1 text-xs">Rows
          <Input id={rowsId} aria-label="Table rows" type="number" min={1} max={10} value={rows}
            onChange={(event) => setRows(Number(event.target.value))} className="h-8 w-16" />
        </label>
        <label htmlFor={colsId} className="flex min-w-0 flex-1 flex-col gap-1 text-xs">Columns
          <Input id={colsId} aria-label="Table columns" type="number" min={1} max={10} value={cols}
            onChange={(event) => setCols(Number(event.target.value))} className="h-8 w-16" />
        </label>
      </div>
      <DropdownMenuItem disabled={!Number.isInteger(rows) || rows < 1 || rows > 10 || !Number.isInteger(cols) || cols < 1 || cols > 10}
        onSelect={() => editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()}>Insert table</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().addRowAfter().run()}>Add row</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().addColumnAfter().run()}>Add column</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().mergeCells().run()}>Merge cells</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().splitCell().run()}>Split cell</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().toggleHeaderRow().run()}>Toggle header row</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().deleteRow().run()}>Delete row</DropdownMenuItem>
      <DropdownMenuItem disabled={!inTable} onSelect={() => editor.chain().focus().deleteColumn().run()}>Delete column</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled={!inTable} variant="destructive" onSelect={() => editor.chain().focus().deleteTable().run()}>Delete table</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
