import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formulaPreview } from "@/shared/formula/formula-preview";
import { ExpressionView } from "@/shared/formula/ui/math/expression-view";
import { QuestionType, questionTypeLabel } from "@/shared/questions/question-types";
import { RichTextEditor } from "@/shared/rich-text/rich-text-editor";
import type { TemplateQuestion } from "../lib/template-model";

/** A question in a test: drag to reorder; set whether it must be answered and the answer it starts with. */
export function QuestionCard({ question, onChange, onRemove }: { question: TemplateQuestion; onChange: (next: TemplateQuestion) => void; onRemove: () => void }) {
  const id = useId();
  const sortable = useSortable({ id: question.key });
  const preview = question.type === QuestionType.Formula ? formulaPreview(question.options[0]) : null;
  return <li ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.6 : 1 }} className="rounded-lg border bg-card p-3">
    <div className="flex items-start gap-2">
      <button type="button" className="mt-0.5 cursor-grab rounded p-1 text-muted-foreground" aria-label={`Move ${question.label}`} {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-4" /></button>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{question.label}</p><p className="text-xs text-muted-foreground">{questionTypeLabel(question.type)}{question.options.length && question.type !== QuestionType.Formula && question.type !== QuestionType.Table ? ` · ${question.options.join(", ")}` : ""}</p>
        {preview?.expression ? <ExpressionView expression={preview.expression} print className="justify-start text-left text-xs" /> : null}</div>
      <div className="flex items-center gap-2"><Switch id={`${id}-required`} checked={question.required} onCheckedChange={(required) => onChange({ ...question, required })} /><Label htmlFor={`${id}-required`} className="text-xs">Required</Label></div>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${question.label}`} onClick={onRemove}><Trash2 className="text-destructive" /></Button>
    </div>
    <details className="mt-2 pl-8"><summary className="cursor-pointer text-xs text-muted-foreground">Default answer{question.description ? " (set)" : ""}</summary>
      <div className="pt-2"><RichTextEditor id={`${id}-default`} label={`Default answer for ${question.label}`} value={question.description} rows={2} onBlur={() => {}} onChange={(description) => onChange({ ...question, description })} /></div></details>
  </li>;
}
