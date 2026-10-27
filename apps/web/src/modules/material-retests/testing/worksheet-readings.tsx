import { WorksheetAttachment } from "./file-field";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { worksheetColumns, type WorksheetField } from "./worksheet-model";
export function WorksheetReadings({ field, instanceId }: { field: WorksheetField; instanceId: string }) {
  if (field.type === 9 || field.type === 10) return <RichTextView html={field.constantValue ?? field.label ?? ""} />;
  if (field.mode === 0) return <p className="whitespace-pre-wrap break-words">{field.constantValue || "No constant configured"}</p>;
  if (field.type === 24) return <p role="status">{field.referencedResult?.resolved ? field.referencedResult.value : field.referencedResult?.message ?? "Reference result pending"}</p>;
  const columns = field.type === 8 ? worksheetColumns(field) : [];
  const fixed = columns.filter((column) => column.fixedValues || column.calculated);
  return <div className="space-y-2 text-sm">
    {fixed.length ? <dl className="grid gap-2 sm:grid-cols-2">{fixed.map((column) => <div key={column.key}><dt className="font-medium">{column.label}</dt><dd className="break-words text-muted-foreground">{column.fixedValues?.join("; ") ?? "Calculated by the server when submitted"}</dd></div>)}</dl> : null}
    {field.values.length ? <details><summary className="cursor-pointer text-muted-foreground">Recorded values and attribution</summary><dl className="space-y-2 pt-2">{field.values.map((entry, index) => <div key={`${entry.rowIndex}:${entry.columnKey}:${index}`}>
      <dt className="font-medium">{entry.rowIndex == null ? "Value" : `Row ${entry.rowIndex + 1}`} {entry.columnKey ?? ""}</dt>
      <dd className="whitespace-pre-wrap break-words">{field.type === 25 && entry.value ? <WorksheetAttachment instanceId={instanceId} reference={entry.value} /> : entry.value || "Not recorded"}</dd>
      <dd className="text-xs text-muted-foreground">{[entry.enteredBy?.firstName, entry.enteredBy?.lastName].filter(Boolean).join(" ")} · {entry.enteredAt}</dd>
    </div>)}</dl></details> : field.readOnly ? <p className="text-muted-foreground">Calculated after submission</p> : null}
  </div>;
}
