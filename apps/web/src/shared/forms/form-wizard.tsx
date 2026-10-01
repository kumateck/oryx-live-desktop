import { lazy, Suspense, useId, useMemo } from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";
import { cn } from "cn";
import { FieldFrame } from "./field-frame";
import { fieldDescription } from "./field-description";
import { useFieldError } from "./field-state";
import type { CustomField, ExtendedWizardField, WizardField } from "./form-wizard-types";

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
  const Renderer = useMemo(() => lazy(field.load), [field.load]);
  const id = useId();
  const error = useFieldError(field.name);
  return <FieldFrame id={id} label={field.label} description={field.description} required={field.required} error={error} className={field.className}>
    <Renderer id={id} name={field.name} control={form.control} disabled={field.disabled ?? false}
      required={field.required ?? false} invalid={Boolean(error)} describedBy={fieldDescription(id, field.description, error)} />
  </FieldFrame>;
}

function ExtendedFieldSlot<TValues extends FieldValues>({ field, form }: {
  field: ExtendedWizardField<TValues>;
  form: UseFormReturn<TValues>;
}) {
  switch (field.type) {
    case "radio":
      return <RadioInputField field={field} />;
    case "switch":
      return <SwitchInputField field={field} />;
    case "slider":
      return <SliderInputField field={field} />;
    case "time": case "clock": case "moment":
      return <TimeInputField field={field} />;
    case "upload":
      return <UploadInputField field={field} />;
    case "image":
      return <ImageInputField field={field} />;
    case "signature":
      return <SignatureInputField field={field} />;
    case "richtext":
      return <RichTextInputField field={field} />;
    case "label": case "space": case "submit":
      return <LayoutField field={field} />;
    case "custom":
      return <CustomInputField field={field} form={form} />;
  }
}

function WizardFieldSlot<TValues extends FieldValues>({ field, form }: {
  field: WizardField<TValues>;
  form: UseFormReturn<TValues>;
}) {
  switch (field.type) {
    case "password":
      return <PasswordInputField field={field} />;
    case "text": case "email": case "number":
      return <TextInputField field={field} />;
    case "date":
      return <DateInputField field={field} />;
    case "date-range":
      return <DateRangeInputField field={field} />;
    case "month":
      return <MonthInputField field={field} />;
    case "textarea":
      return <TextareaInputField field={field} />;
    case "select":
      if (field.mode === "multiple") return <MultiSelectInputField field={field} />;
      if (field.source === "async") return <AsyncSelectInputField field={field} />;
      return <SelectInputField field={field} />;
    case "checkbox":
      return <CheckboxInputField field={field} />;
    default:
      return <ExtendedFieldSlot field={field} form={form} />;
  }
}

export function FormWizard<TValues extends FieldValues>({ form, fields, className }: FormWizardProps<TValues>) {
  return <FormProvider {...form}><div className={cn("grid min-w-0 grid-cols-1 gap-4", className)}>
    {fields.map((field) => <Suspense key={"name" in field ? field.name : field.id} fallback={<div className="h-14 min-w-0 animate-pulse rounded-lg bg-muted" aria-label={`Loading ${"label" in field ? field.label : "form layout"}`} />}>
      <WizardFieldSlot field={field} form={form} />
    </Suspense>)}
  </div></FormProvider>;
}

export type { WizardField, CustomFieldProps } from "./form-wizard-types";
