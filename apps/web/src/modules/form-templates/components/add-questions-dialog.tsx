import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formsApi } from "@/shared/api/generated/forms";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { questionSchema, type FormQuestion } from "@/shared/form-response/form-model";
import { formulaPreview } from "@/shared/formula/formula-preview";
import { ExpressionView } from "@/shared/formula/ui/math/expression-view";
import { QuestionType, questionTypeLabel } from "@/shared/questions/question-types";
import { localKey, type FormType, type TemplateQuestion } from "../lib/template-model";
import { templatesAudit } from "../lib/templates";

const pageSize = 30;
type Pickable = FormQuestion & { id: string };

/** Picks questions for one test. Questions already in the test start ticked; unticking removes them when the dialog is confirmed. */
export function AddQuestionsDialog({ current, formType, onConfirm, onClose }: { current: readonly TemplateQuestion[]; formType: FormType; onConfirm: (questions: TemplateQuestion[]) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [chosen, setChosen] = useState<TemplateQuestion[]>(() => [...current]);
  useEffect(() => { const timer = window.setTimeout(() => { setTerm(search.trim()); setPage(1); }, 300); return () => window.clearTimeout(timer); }, [search]);
  const query = formsApi.useGetApiV1FormQuestionQuery({ ...templatesAudit, page, pageSize, searchQuery: term, formType });
  const rows: Pickable[] = (query.data?.data ?? []).flatMap((row) => { const parsed = questionSchema.safeParse(row); return parsed.success && parsed.data.id ? [{ ...parsed.data, id: parsed.data.id }] : []; });
  const pages = query.data?.pageCount ?? 1;
  const toggle = (question: Pickable) => setChosen((list) => list.some((entry) => entry.questionId === question.id) ? list.filter((entry) => entry.questionId !== question.id)
    : [...list, { key: localKey("field"), fieldId: null, questionId: question.id, label: question.label, type: question.type, options: question.options, required: false, description: "" }]);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Questions for this test</DialogTitle><DialogDescription>{chosen.length} selected. Only questions that suit this kind of template are listed.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        <Input aria-label="Search questions" placeholder="Search questions" value={search} onChange={(event) => setSearch(event.target.value)} />
        {query.error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(query.error)} <Button size="xs" variant="ghost" onClick={() => void query.refetch()}>Retry</Button></p> : null}
        {query.isLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner />Loading questions…</p> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No questions found.</p> : null}
        <ul className="space-y-2" aria-busy={query.isFetching}>{rows.map((row) => { const checked = chosen.some((entry) => entry.questionId === row.id); const preview = row.type === QuestionType.Formula ? formulaPreview(row.options[0]) : null;
          return <li key={row.id}><label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 ${checked ? "border-primary bg-muted" : ""}`}>
            <Checkbox className="mt-0.5" checked={checked} onCheckedChange={() => toggle(row)} aria-label={row.label} />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{row.label}</span><span className="text-xs text-muted-foreground">{questionTypeLabel(row.type)}</span>
              {preview?.expression ? <ExpressionView expression={preview.expression} print className="justify-start text-left text-xs" /> : null}</span></label></li>; })}</ul>
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page {page} of {Math.max(pages, 1)}</span><span className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button type="button" size="sm" variant="ghost" disabled={page >= pages || query.isFetching} onClick={() => setPage(page + 1)}>Next</Button></span></div>
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" onClick={() => onConfirm(chosen)}>Use {chosen.length} {chosen.length === 1 ? "question" : "questions"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
