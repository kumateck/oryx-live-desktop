import { useEffect, useId, useState, type ChangeEvent, type DragEvent } from "react";
import { useController, useFormContext, type FieldValues } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldFrame } from "../field-frame";
import { fieldDescription } from "../field-description";
import { acceptsFile } from "../file-selection";
import type { ImageField } from "../form-wizard-types";

export default function ImageInputField({ field }: { field: ImageField<FieldValues> }) {
  const form = useFormContext<FieldValues>();
  const id = useId();
  const { field: control, fieldState } = useController({ name: field.name, control: form.control });
  const file = control.value instanceof File ? control.value : null;
  const [preview, setPreview] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => { URL.revokeObjectURL(url); };
  }, [file]);
  const choose = (incoming: File | undefined) => {
    if (!incoming) return;
    if (!acceptsFile(incoming, "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp", field.maxSizeBytes ?? 5_000_000)) {
      setSelectionError("Choose a PNG, JPEG, or WebP image within the size limit.");
      return;
    }
    setSelectionError(null);
    control.onChange(incoming);
  };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { choose(event.target.files?.[0]); event.target.value = ""; };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); if (!field.disabled) choose(event.dataTransfer.files[0]); };
  const source = preview ?? (file ? null : field.existingUrl);
  const error = fieldState.error?.message;
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <div className="flex min-w-0 flex-wrap items-start gap-3">
      <label htmlFor={id} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}
        className="flex size-32 cursor-pointer items-center justify-center rounded-lg border border-dashed border-input p-2 text-center text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-ring has-disabled:opacity-50">
        Select or drop image
        <Input id={id} ref={control.ref} name={control.name} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={onInput}
          onBlur={control.onBlur} disabled={field.disabled} aria-required={field.required} aria-invalid={Boolean(error || selectionError)}
          aria-describedby={fieldDescription(id, field.description, error)} className="sr-only" />
      </label>
      {source ? <div className="space-y-1"><img src={source} alt={`${field.label} preview`} className="size-32 rounded-lg object-cover" />
        {file || field.onRemoveExisting ? <Button type="button" size="xs" variant="ghost" disabled={field.disabled}
          onClick={() => { if (file) control.onChange(null); else field.onRemoveExisting?.(); }}>Remove image</Button> : null}</div> : null}
    </div>
    {selectionError ? <p role="alert" className="text-xs text-destructive">{selectionError}</p> : null}
  </FieldFrame>;
}
