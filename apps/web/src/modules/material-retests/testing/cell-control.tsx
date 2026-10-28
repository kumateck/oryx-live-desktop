import { useContext } from "react";
import { useController } from "react-hook-form";
import { z } from "zod";
import type { CustomFieldProps } from "@/shared/forms/form-wizard-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorksheetCellContext } from "./cell-context";
import type { WorksheetValues } from "./worksheet-model";
import { WorksheetFileField } from "./file-field";
export default function WorksheetCellControl({ id, name, control, disabled, invalid, describedBy }: CustomFieldProps<WorksheetValues>) {
  const context = useContext(WorksheetCellContext);
  const index = Number(name.split(".")[1]);
  const definition = context?.definitions[index];
  const { field } = useController({ name, control });
  const value = typeof field.value === "string" ? field.value : "";
  if (!definition || !context) return <p role="alert">The worksheet field could not be resolved.</p>;
  const props = { id, disabled, "aria-invalid": invalid, "aria-describedby": describedBy, onBlur: field.onBlur };
  if (definition.type === 25) return <WorksheetFileField id={id} instanceId={context.instanceId} fieldKey={definition.fieldKey} require={context.require} value={value} disabled={disabled} onChange={field.onChange} />;
  if (definition.type === 7) return <Checkbox {...props} checked={value === "true"} onCheckedChange={(next) => field.onChange(next === true ? "true" : "false")} />;
  if (definition.type === 6 && definition.options.length) {
    const parsed = (() => { try { return z.string().array().parse(JSON.parse(value || "[]")); } catch { return value.trim() ? [value.trim()] : []; } })();
    return <div id={id} className="flex flex-wrap gap-3" role="group" aria-label={definition.label}>{definition.options.map((option, optionIndex) => <label key={option} className="flex items-center gap-2" htmlFor={`${id}-${optionIndex}`}>
      <Checkbox id={`${id}-${optionIndex}`} disabled={disabled} checked={parsed.includes(option)} onCheckedChange={(checked) => { const next = checked ? [...parsed, option] : parsed.filter((entry) => entry !== option); field.onChange(next.length ? JSON.stringify(next) : ""); }} />{option}</label>)}</div>;
  }
  const choices = definition.type === 14 ? context.equipment : definition.type === 15 || definition.type === 16 ? context.reagents : definition.options.map((option) => ({ value: option, label: option }));
  if (choices.length || [14, 15, 16].includes(definition.type)) return <Select value={value} disabled={disabled} onValueChange={field.onChange}><SelectTrigger {...props}><SelectValue placeholder="Choose a value" /></SelectTrigger><SelectContent>{choices.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
  if (definition.type === 1) return <Textarea {...props} value={value} onChange={(event) => field.onChange(event.target.value)} rows={3} />;
  const type = definition.type === 3 ? "date" : [4, 20].includes(definition.type) ? "time" : "text";
  return <Input {...props} type={type} step={type === "time" ? 1 : undefined} inputMode={[2, 11, 18, 19, 22].includes(definition.type) ? "decimal" : undefined} value={value} onChange={(event) => field.onChange(event.target.value)} />;
}
