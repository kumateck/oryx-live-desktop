import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId } from "react";
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/shared/rich-text/rich-text-editor";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { blankHtml, type TemplateSection } from "../lib/template-model";
import { QuestionCard } from "./question-card";

/** One test: its name and specification text, its group, and its questions in order. */
export function SectionCard({ section, index, open, selected, canRemove, onToggle, onSelect, onChange, onRemove, onAddQuestions }: {
  section: TemplateSection; index: number; open: boolean; selected: boolean; canRemove: boolean; onToggle: () => void; onSelect: () => void;
  onChange: (next: TemplateSection) => void; onRemove: () => void; onAddQuestions: () => void;
}) {
  const id = useId();
  const sortable = useSortable({ id: section.key });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const title = `Test ${String(index + 1)}`;
  const reorder = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = section.questions.findIndex((question) => question.key === active.id);
    const to = section.questions.findIndex((question) => question.key === over.id);
    if (from >= 0 && to >= 0) onChange({ ...section, questions: arrayMove(section.questions, from, to) });
  };
  return <li ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.65 : 1 }}
    className={`rounded-lg border bg-card p-3 ${selected ? "border-primary" : ""}`}>
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="cursor-grab rounded p-1 text-muted-foreground" aria-label={`Move ${title}`} {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-4" /></button>
      <Checkbox checked={selected} onCheckedChange={onSelect} aria-label={`Select ${title} for grouping`} />
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left hover:bg-muted">
        {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
        <span className="min-w-0 truncate text-sm font-medium">{blankHtml(section.name) ? title : <RichTextView html={section.name} />}</span>
        <span className="text-xs text-muted-foreground">{section.questions.length} {section.questions.length === 1 ? "question" : "questions"}</span>
      </button>
      {section.groupName ? <span className="flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs"><Users className="size-3" />{section.groupName}
        <button type="button" aria-label={`Remove ${title} from ${section.groupName}`} onClick={() => onChange({ ...section, groupName: "" })}><X className="size-3" /></button></span> : null}
      <Button type="button" size="sm" variant="outline" onClick={onAddQuestions}><Plus />Questions</Button>
      {canRemove ? <Button type="button" size="icon-sm" variant="ghost" aria-label={`Delete ${title}`} onClick={onRemove}><Trash2 className="text-destructive" /></Button> : null}
    </div>
    {open ? <div className="mt-3 space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="space-y-1"><p className="text-sm font-medium">Test <span className="text-destructive">*</span></p><RichTextEditor id={`${id}-name`} label={`${title} name`} value={section.name} rows={2} placeholder={`${title} name`} onBlur={() => {}} onChange={(name) => onChange({ ...section, name })} invalid={blankHtml(section.name)} /></div>
        <div className="space-y-1"><p className="text-sm font-medium">Specification</p><RichTextEditor id={`${id}-spec`} label={`${title} specification`} value={section.description} rows={2} placeholder={`${title} specification`} onBlur={() => {}} onChange={(description) => onChange({ ...section, description })} /></div>
      </div>
      {section.questions.length === 0 ? <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">No questions yet. A test can be saved without questions and filled in later.</p>
        : <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={reorder}>
          <SortableContext items={section.questions.map((question) => question.key)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2">{section.questions.map((question) => <QuestionCard key={question.key} question={question}
              onChange={(next) => onChange({ ...section, questions: section.questions.map((entry) => entry.key === next.key ? next : entry) })}
              onRemove={() => onChange({ ...section, questions: section.questions.filter((entry) => entry.key !== question.key) })} />)}</ol>
          </SortableContext></DndContext>}
    </div> : null}
  </li>;
}
