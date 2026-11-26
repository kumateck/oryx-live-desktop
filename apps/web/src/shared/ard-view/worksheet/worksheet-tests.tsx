import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FormFieldDto, FormResponseDto, FormSectionDto } from "@/shared/ard-view/dto";
import { renderEmptyValue } from "@/shared/ard-view/raw-data/print/question-renderers/empty-value";
import { renderStoredValue } from "@/shared/ard-view/raw-data/print/question-renderers/stored-value";
import { getBestResponseMap } from "@/shared/ard-view/raw-data/print/response-pick";
import { getHeaderFieldForSection, hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import ViewFormulaQuestion from "@/shared/ard-view/raw-data/print/view-formula-question";
import { selectedOptionLabels } from "@/shared/ard-view/response/selected-options";
import { getResponsesForSection } from "@/shared/ard-view/templates/render";
import { QuestionType } from "@/shared/questions/question-types";
import { RichTextView, richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { answerLabel, answerLayout, answeredField, isChoiceQuestion, showsSectionResult } from "./answer-layout";
import { formulaView } from "./formula-model";
import { FormulaSheet } from "./formula-sheet";

const label = "text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground";
const line = <span aria-hidden className="block h-5 border-b border-border" />;

function instrumentText(instrument: FormSectionDto["instrument"]): string {
  if (typeof instrument === "string") return instrument;
  if (!instrument || typeof instrument !== "object") return "";
  const record: { id?: string | null; name?: string | null } = instrument;
  return record.id || record.name || "";
}

/** A formula answer laid out in full; uniformity tables and unreadable configurations keep their own views. */
function FormulaAnswer({ field, response, blank, title }: { field: FormFieldDto; response: FormResponseDto | undefined; blank: boolean; title: string }) {
  const view = useMemo(() => formulaView(field, response, blank), [field, response, blank]);
  if (view.kind === "worksheet") return <FormulaSheet view={view} title={title} />;
  if (view.kind === "uniformity" || !response || blank) return <ViewFormulaQuestion questionOption={field.question?.options?.[0]} />;
  return <ViewFormulaQuestion questionOption={response.formField?.question?.options?.[0]} responseRecord={response} response={response.value} />;
}

function answerValue(field: FormFieldDto, response: FormResponseDto | undefined, blank: boolean): ReactNode {
  const type = field.question?.type;
  if (blank || !response || !hasMeaningfulResponse(response)) {
    if (!blank) return <span className="text-muted-foreground">Not recorded</span>;
    return type === QuestionType.ShortAnswer || type === undefined || type === null ? line : renderEmptyValue(type, field.question?.options ?? undefined);
  }
  const answered = answeredField(response, field);
  if (isChoiceQuestion(type)) return <span className="font-medium">{selectedOptionLabels(answered).join(", ") || "—"}</span>;
  return renderStoredValue(answered);
}

function Answer({ section, field, response, blank }: { section: FormSectionDto; field: FormFieldDto; response: FormResponseDto | undefined; blank: boolean }) {
  const layout = answerLayout(field.question?.type);
  const name = answerLabel(section.name, field.question?.label);
  const note = (field.description ?? "").trim() ? <RichTextView html={field.description ?? ""} className="text-xs text-muted-foreground [&_p]:m-0" /> : null;
  if (layout === "formula") return <div className="space-y-2">
    {name !== "Observation" ? <p className="font-semibold">{name}</p> : null}{note}
    <FormulaAnswer field={field} response={response} blank={blank} title={name === "Observation" ? richTextToPlain(section.name ?? "") : name} />
  </div>;
  if (layout === "block") return <div className="space-y-1.5">
    <p className="font-medium">{name}</p>{note}
    <div className="min-w-0 max-w-full overflow-x-auto">{answerValue(field, response, blank)}</div>
  </div>;
  return <div className="grid grid-cols-[minmax(8rem,2fr)_3fr] items-baseline gap-x-4 border-b border-dashed border-border/70 py-1.5 last:border-b-0">
    <div className="min-w-0"><span className="font-medium">{name}</span>{note}</div>
    <div className="min-w-0 break-words">{answerValue(field, response, blank)}</div>
  </div>;
}

/** The test's equipment and instrument IDs, beside its name. */
function TestHeaderIds({ section, responses, blank }: { section: FormSectionDto; responses: Map<string, FormResponseDto>; blank: boolean }) {
  const fields = section.fields ?? [];
  const instrument = getHeaderFieldForSection(fields, QuestionType.Instrument, responses);
  const equipment = getHeaderFieldForSection(fields, QuestionType.Equipment, responses);
  const instrumentValue = blank ? "" : instrument?.value || instrumentText(section.instrument);
  const ids = [
    ...(instrument?.exists || instrumentValue ? [{ name: "Instrument ID", value: instrumentValue }] : []),
    ...(equipment?.exists ? [{ name: "Equipment ID", value: blank ? "" : equipment.value }] : []),
  ];
  if (!ids.length) return null;
  return <dl className="flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-sm">{ids.map((id) => <div key={id.name} className="min-w-36">
    <dt className={label}>{id.name}</dt><dd>{id.value || <span aria-hidden className="block h-5 w-36 border-b border-border" />}</dd>
  </div>)}</dl>;
}

/** One numbered test: its name and IDs, its specification and calculated result, then each recorded observation. */
function WorksheetTest({ section, number, responses, blank }: { section: FormSectionDto; number: number; responses: Map<string, FormResponseDto>; blank: boolean }) {
  const fields = section.fields ?? [];
  const answers = fields.filter((field) => answerLayout(field.question?.type) !== "header");
  const specification = richTextToPlain(section.description ?? "") ? section.description ?? "" : "";
  const withResult = showsSectionResult(answers);
  return <section aria-label={`Test ${number}`} className="qc-worksheet-test overflow-hidden rounded-md border border-border bg-card text-card-foreground">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/60 px-3 py-2">
      <h3 className="flex min-w-0 flex-1 items-baseline gap-2 text-base font-semibold">
        <span className="tabular-nums text-muted-foreground">{number}.</span>
        <RichTextView html={section.name ?? ""} className="min-w-0 [&_p]:m-0" />
      </h3>
      <TestHeaderIds section={section} responses={responses} blank={blank} />
    </header>
    {/* Two columns only when there is a calculated result beside the specification; otherwise the specification spans the test. */}
    {specification || withResult ? <dl className={cn("grid gap-x-6 gap-y-2 border-b border-border px-3 py-2 text-sm", specification && withResult && "sm:grid-cols-2 print:grid-cols-2")}>
      {specification ? <div className="min-w-0"><dt className={label}>Specification</dt><dd><RichTextView html={specification} className="[&_p]:m-0" /></dd></div> : null}
      {withResult ? <div className="min-w-0"><dt className={label}>Result</dt><dd className="font-semibold">{blank ? line : getResponsesForSection(answers, responses, { worksheet: true })}</dd></div> : null}
    </dl> : null}
    <div className="space-y-3 px-3 py-2.5 text-sm">
      {answers.length ? answers.map((field) => <Answer key={field.id} section={section} field={field} blank={blank} response={field.id ? responses.get(field.id) : undefined} />)
        : <p className="text-muted-foreground">No observations are recorded for this test.</p>}
    </div>
  </section>;
}

/**
 * The analytical worksheet's tests, numbered, as a filled record or (blank) with writing lines and empty boxes.
 * The same layout is used on screen, in print preview and on paper.
 */
export function WorksheetTests({ sections, responses, blank = false }: { sections: readonly FormSectionDto[] | null | undefined; responses: readonly FormResponseDto[] | null | undefined; blank?: boolean }) {
  const map = useMemo(() => blank ? new Map<string, FormResponseDto>() : getBestResponseMap([...(responses ?? [])]), [blank, responses]);
  if (!sections?.length) return null;
  return <div className="qc-worksheet space-y-3 p-1">
    {sections.map((section, index) => <WorksheetTest key={section.id ?? index} section={section} number={index + 1} responses={map} blank={blank} />)}
  </div>;
}
