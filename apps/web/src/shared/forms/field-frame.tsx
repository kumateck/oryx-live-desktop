import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

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
    {description ? <FieldDescription id={`${id}-description`}>{description}</FieldDescription> : null}
    {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
  </Field>;
}
