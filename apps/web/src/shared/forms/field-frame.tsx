import type { ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

import { RichTextView } from "@/shared/rich-text/rich-text-view";

interface FieldFrameProps {
  id: string;
  label: string;
  description?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function FieldFrame({ id, label, description, error, required, className, children }: FieldFrameProps) {
  return <Field data-invalid={Boolean(error)} className={className}>
    <FieldLabel id={`${id}-label`} htmlFor={id}>
      {label}{required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}
    </FieldLabel>
    {children}
    {description ? <div id={`${id}-description`} data-slot="field-description" className="text-sm leading-normal text-muted-foreground"><RichTextView html={description} /></div> : null}
    {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
  </Field>;
}
