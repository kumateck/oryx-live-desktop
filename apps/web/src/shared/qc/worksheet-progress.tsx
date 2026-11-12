import { useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FormResponseDto } from "@/shared/ard-view/dto";
import { hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import { draftStatus } from "@/shared/form-response/draft-status";
import type { AnswerForm } from "@/shared/form-response/form-model";
import type { StoredAnswers } from "@/shared/form-response/use-answer-form";
import type { FormAssignees } from "./assignments";

const noLocalWrites = new Map<string, string>();

export function worksheetProgress(form: AnswerForm, stored: StoredAnswers, responses: readonly FormResponseDto[], assignments: FormAssignees | null) {
  const analystByField = new Map<string, string>();
  for (const analyst of assignments?.analysts ?? []) {
    for (const id of analyst.fieldIds) analystByField.set(id, analyst.name);
  }

  const needsRecalculation = new Set(responses.filter((row) => row.formulaRepairPending).map((row) => row.formField?.id));
  const sections = form.sections.filter((section) => section.fields.length > 0).map((section) => {
    const fields = section.fields.map((field) => ({
      id: field.id,
      label: field.question.label,
      analyst: analystByField.get(field.id) ?? "Unassigned",
      complete: !needsRecalculation.has(field.id) && draftStatus(field, undefined, false, stored, noLocalWrites) === "saved",
    }));
    return { id: section.id, name: section.name, fields, completed: fields.filter((field) => field.complete).length };
  });

  const total = sections.reduce((sum, section) => sum + section.fields.length, 0);
  const completed = sections.reduce((sum, section) => sum + section.completed, 0);
  return { sections, completed, outstanding: total - completed };
}

export function WorksheetProgress({ form, stored, responses, assignments, submitted, preview }: {
  form: AnswerForm | null;
  stored: StoredAnswers;
  responses: readonly FormResponseDto[];
  assignments: FormAssignees | null;
  submitted: boolean;
  preview: (close: () => void) => ReactNode;
}) {
  const [printing, setPrinting] = useState(false);
  if (!form) return <p className="text-sm text-muted-foreground">This test has no worksheet.</p>;
  const progress = worksheetProgress(form, stored, responses, assignments);
  if (progress.sections.length === 0) return <p className="text-sm text-muted-foreground">This worksheet has no test fields.</p>;
  const canPrint = responses.some((row) => hasMeaningfulResponse(row));

  return <section aria-label="Worksheet progress" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="flex flex-wrap gap-x-5 text-sm tabular-nums">
          <span><strong>{progress.completed}</strong> completed</span>
          <span><strong>{progress.outstanding}</strong> outstanding</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {submitted ? "Worksheet submitted" : "Worksheet in progress · shows saved answers"}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={!canPrint} onClick={() => setPrinting(true)}>
        <Printer />Print filled worksheet
      </Button>
    </div>

    <div className="rounded-md border">
      <Table>
        <TableHeader><TableRow>
          <TableHead>Test field</TableHead>
          <TableHead className="w-1/4">Assigned analyst</TableHead>
          <TableHead className="w-36">Status</TableHead>
        </TableRow></TableHeader>
        {progress.sections.map((section) => <TableBody key={section.id}>
          <TableRow className="bg-muted/50">
            <TableHead colSpan={3} scope="rowgroup" className="h-auto whitespace-normal py-2">
              <span className="font-semibold">{section.name || "Test results"}</span>
              <span className="ml-3 text-xs font-normal text-muted-foreground tabular-nums">{section.completed} of {section.fields.length} completed</span>
            </TableHead>
          </TableRow>
          {section.fields.map((field) => <TableRow key={field.id}>
            <TableCell className="whitespace-normal">{field.label}</TableCell>
            <TableCell className="whitespace-normal">{field.analyst}</TableCell>
            <TableCell><Badge variant={field.complete ? "secondary" : "outline"}>{field.complete ? "Completed" : "Outstanding"}</Badge></TableCell>
          </TableRow>)}
        </TableBody>)}
      </Table>
    </div>
    {printing ? preview(() => setPrinting(false)) : null}
  </section>;
}
