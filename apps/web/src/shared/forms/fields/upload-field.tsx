import { useId, useState, type ChangeEvent, type DragEvent } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { acceptsFile, mergeFiles } from "../file-selection";
import type { UploadField } from "../form-wizard-types";

export default function UploadInputField({ field }: { field: UploadField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const files: File[] = field.mode === "single"
    ? control.value instanceof File ? [control.value] : []
    : Array.isArray(control.value) ? control.value.filter((item): item is File => item instanceof File) : [];
  const error = fieldState.error?.message;
  const persisted = field.persisted ?? [];
  const choose = (incoming: readonly File[]) => {
    const accepted = incoming.filter((file) => acceptsFile(file, field.accept, field.maxSizeBytes));
    setSelectionError(accepted.length === incoming.length ? null : "Some files were rejected by the file type or size limit.");
    if (accepted.length === 0) return;
    control.onChange(field.mode === "single" ? accepted[0] : mergeFiles(files, accepted));
  };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    choose(Array.from(event.target.files ?? []));
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!field.disabled) choose(Array.from(event.dataTransfer.files));
  };
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <label htmlFor={id} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}
      className="flex min-h-20 min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input px-3 py-3 text-center text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <span>Choose {field.mode === "single" ? "a file" : "files"} or drag and drop</span>
      <Input id={id} ref={control.ref} name={control.name} type="file" accept={field.accept} multiple={field.mode === "multiple"}
        onChange={onInput} onBlur={control.onBlur} disabled={field.disabled} aria-required={field.required}
        aria-invalid={Boolean(error || selectionError)} aria-describedby={fieldDescription(id, field.description, error)} className="sr-only" />
    </label>
    {selectionError ? <p role="alert" className="text-xs text-destructive">{selectionError}</p> : null}
    {files.length || persisted.length ? <ul className="min-w-0 space-y-1 text-sm">
      {persisted.map((item) => <li key={item.id} className="flex min-w-0 items-center justify-between gap-2">
        {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="truncate underline">{item.name}</a>
          : <span className="truncate">{item.name}</span>}
        {field.onPersistedChange ? <Button type="button" size="xs" variant="ghost" disabled={field.disabled}
          aria-label={`Remove ${item.name}`} onClick={() => field.onPersistedChange?.(persisted.filter((entry) => entry.id !== item.id))}>Remove</Button> : null}
      </li>)}
      {files.map((file) => <li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate">{file.name}</span>
        <Button type="button" size="xs" variant="ghost" disabled={field.disabled} aria-label={`Remove ${file.name}`}
          onClick={() => control.onChange(field.mode === "single" ? null : files.filter((entry) => entry !== file))}>Remove</Button>
      </li>)}
    </ul> : null}
  </FieldFrame>;
}
