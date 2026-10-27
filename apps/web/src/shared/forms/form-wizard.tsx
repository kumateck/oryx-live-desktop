import { lazy, Suspense, useId, useMemo, useState } from "react";
import { FormProvider, useFormState, type FieldValues, type UseFormReturn } from "react-hook-form";
import { cn } from "cn";
import { CustomFieldBoundary } from "./custom-field-boundary";
import { FieldFrame } from "./field-frame";
import { fieldDescription } from "./field-description";
import { useFieldError } from "./field-state";
import type { CustomField, ExtendedWizardField, WizardField } from "./form-wizard-types";
import { useFormUpdateSafety } from "../updates/form-update-safety";
import { InputTypes } from "./input-types";

const TextInputField = lazy(() => import("./fields/text-field"));
const PasswordInputField = lazy(() => import("./fields/password-field"));
const TextareaInputField = lazy(() => import("./fields/textarea-field"));
const SelectInputField = lazy(() => import("./fields/select-field"));
const AsyncSelectInputField = lazy(() => import("./fields/async-select-field"));
const MultiSelectInputField = lazy(() => import("./fields/multi-select-field"));
const CheckboxInputField = lazy(() => import("./fields/checkbox-field"));
const DateInputField = lazy(() => import("./fields/date-field"));
const DateRangeInputField = lazy(() => import("./fields/date-range-field"));
const MonthInputField = lazy(() => import("./fields/month-field"));
const MonthRangeInputField = lazy(() => import("./fields/month-range-field"));
const RadioInputField = lazy(() => import("./fields/radio-field"));
const SwitchInputField = lazy(() => import("./fields/switch-field"));
const SliderInputField = lazy(() => import("./fields/slider-field"));
const TimeInputField = lazy(() => import("./fields/time-field"));
const UploadInputField = lazy(() => import("./fields/upload-field"));
const ImageInputField = lazy(() => import("./fields/image-field"));
const SignatureInputField = lazy(() => import("./fields/signature-field"));
const RichTextInputField = lazy(() => import("./fields/rich-text-field"));
const LayoutField = lazy(() => import("./fields/layout-field"));

interface FormWizardProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  fields: readonly WizardField<TValues>[];
  className?: string;
}

function CustomInputField<TValues extends FieldValues>({ field, form }: {
  field: CustomField<TValues>;
  form: UseFormReturn<TValues>;
}) {
  const [attempt, setAttempt] = useState(0);
  // A retry must create a fresh lazy loader; React caches a rejected loader.
  const Renderer = useMemo(() => lazy(field.load), [field.load, attempt]);
  const id = useId();
  const error = useFieldError(field.name);
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <CustomFieldBoundary key={attempt} label={field.label} onRetry={() => setAttempt((value) => value + 1)}>
      <Suspense fallback={<div role="status" className="animate-pulse rounded-md border p-4 text-sm text-muted-foreground">Loading {field.label}…</div>}>
        <Renderer id={id} name={field.name} control={form.control} disabled={field.disabled ?? false}
          required={field.required ?? false} invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)} />
      </Suspense>
    </CustomFieldBoundary>
  </FieldFrame>;
}

function ExtendedFieldSlot<TValues extends FieldValues>({ field, form }: {
  field: ExtendedWizardField<TValues>;
  form: UseFormReturn<TValues>;
}) {
  switch (field.type) {
    case InputTypes.RADIO:
      return <RadioInputField field={field} />;
    case InputTypes.SWITCH:
      return <SwitchInputField field={field} />;
    case InputTypes.SLIDER:
      return <SliderInputField field={field} />;
    case InputTypes.TIME: case InputTypes.CLOCK: case InputTypes.MOMENT:
      return <TimeInputField field={field} />;
    case InputTypes.UPLOAD:
      return <UploadInputField field={field} />;
    case InputTypes.IMAGE:
      return <ImageInputField field={field} />;
    case InputTypes.SIGNATURE:
      return <SignatureInputField field={field} />;
    case InputTypes.RICHTEXT:
      return <RichTextInputField field={field} />;
    case InputTypes.LABEL: case InputTypes.SPACE: case InputTypes.SUBMIT:
      return <LayoutField field={field} />;
    case InputTypes.CUSTOM:
      return <CustomInputField field={field} form={form} />;
  }
}

function WizardFieldSlot<TValues extends FieldValues>({ field, form }: {
  field: WizardField<TValues>;
  form: UseFormReturn<TValues>;
}) {
  switch (field.type) {
    case InputTypes.PASSWORD:
      return <PasswordInputField field={field} />;
    case InputTypes.TEXT: case InputTypes.EMAIL: case InputTypes.NUMBER:
      return <TextInputField field={field} />;
    case InputTypes.DATE:
      return <DateInputField field={field} />;
    case InputTypes.RANGE:
      return <DateRangeInputField field={field} />;
    case InputTypes.MONTH:
      return <MonthInputField field={field} />;
    case InputTypes.MONTH_RANGE:
      return <MonthRangeInputField field={field} />;
    case InputTypes.TEXTAREA:
      return <TextareaInputField field={field} />;
    case InputTypes.SELECT:
      if (field.mode === "multiple") return <MultiSelectInputField field={field} />;
      if (field.source === "async") return <AsyncSelectInputField field={field} />;
      return <SelectInputField field={field} />;
    case InputTypes.CHECKBOX:
      return <CheckboxInputField field={field} />;
    default:
      return <ExtendedFieldSlot field={field} form={form} />;
  }
}

export function FormWizard<TValues extends FieldValues>({ form, fields, className }: FormWizardProps<TValues>) {
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  useFormUpdateSafety(isDirty || isSubmitting);
  return <FormProvider {...form}><div className={cn("grid min-w-0 grid-cols-1 gap-4", className)}>
    {fields.map((field) => <Suspense key={"name" in field ? field.name : field.id} fallback={<div className="h-14 min-w-0 animate-pulse rounded-lg bg-muted" aria-label={`Loading ${"label" in field ? field.label : "form layout"}`} />}>
      <WizardFieldSlot field={field} form={form} />
    </Suspense>)}
  </div></FormProvider>;
}

export type { WizardField, CustomFieldProps } from "./form-wizard-types";
