import type { ComponentType } from "react";
import type { DateRange } from "react-day-picker";
import type { Control, FieldPath, FieldPathByValue, FieldValues } from "react-hook-form";

interface FieldBase<TValues extends FieldValues, TName extends FieldPath<TValues> = FieldPath<TValues>> {
  name: TName;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface TextField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
}

export interface NumberField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, number | null | undefined>> {
  type: "number";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
}

export interface TextareaField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "textarea";
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
}

interface CalendarBounds {
  minDate?: Date;
  maxDate?: Date;
  fromYear?: number;
  toYear?: number;
  placeholder?: string;
}

export interface DateField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, Date | null | undefined>>, CalendarBounds {
  type: "date";
}

export interface DateRangeField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, DateRange | null | undefined>>, CalendarBounds {
  type: "date-range";
}

export interface MonthField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "month";
  placeholder?: string;
  minMonth?: string;
  maxMonth?: string;
  fromYear?: number;
  toYear?: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectPage {
  options: readonly SelectOption[];
  hasNext: boolean;
  hasPrevious: boolean;
}

export type SelectLoader = (search: string, page: number, signal: AbortSignal) => Promise<SelectPage>;

interface SelectBase<TValues extends FieldValues, TName extends FieldPath<TValues>> extends FieldBase<TValues, TName> {
  type: "select";
  placeholder?: string;
  searchPlaceholder?: string;
}

interface SyncSelect {
  source: "sync";
  options: readonly SelectOption[];
}

interface AsyncSelect {
  source: "async";
  loadOptions: SelectLoader;
  debounceMs?: number;
}

export type SelectField<TValues extends FieldValues> =
  (SelectBase<TValues, FieldPathByValue<TValues, SelectOption | null | undefined>> & { mode: "single" } & (SyncSelect | AsyncSelect))
  | (SelectBase<TValues, FieldPathByValue<TValues, readonly SelectOption[] | undefined>> & { mode: "multiple" } & (SyncSelect | AsyncSelect));

export type SingleSelectField<TValues extends FieldValues> = Extract<SelectField<TValues>, { mode: "single" }>;
export type MultiSelectField<TValues extends FieldValues> = Extract<SelectField<TValues>, { mode: "multiple" }>;

export interface CheckboxField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, boolean | undefined>> {
  type: "checkbox";
}

export interface RadioField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "radio";
  options: readonly SelectOption[];
}

export interface SwitchField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, boolean | undefined>> {
  type: "switch";
}

export interface SliderField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, number | null | undefined>> {
  type: "slider";
  min: number;
  max: number;
  step?: number;
}

export interface TimeField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "time" | "clock" | "moment";
  showDays?: boolean;
  maxDays?: number;
}

export interface PersistedAttachment {
  id: string;
  name: string;
  url?: string;
}

interface UploadBase<TValues extends FieldValues, TName extends FieldPath<TValues>> extends FieldBase<TValues, TName> {
  type: "upload";
  accept?: string;
  maxSizeBytes?: number;
  persisted?: readonly PersistedAttachment[];
  onPersistedChange?: (attachments: readonly PersistedAttachment[]) => void;
}

export type UploadField<TValues extends FieldValues> =
  | (UploadBase<TValues, FieldPathByValue<TValues, File | null | undefined>> & { mode: "single" })
  | (UploadBase<TValues, FieldPathByValue<TValues, readonly File[] | undefined>> & { mode: "multiple" });

export interface ImageField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, File | null | undefined>> {
  type: "image";
  existingUrl?: string;
  onRemoveExisting?: () => void;
  maxSizeBytes?: number;
}

export interface SignatureField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "signature";
}

export interface RichTextReference {
  id: string;
  label: string;
  kind: "user" | "tag";
}

export interface RichTextField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: "richtext";
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  references?: readonly RichTextReference[];
}

interface LayoutBase {
  id: string;
  className?: string;
}

export interface LabelField extends LayoutBase {
  type: "label";
  label: string;
  text?: string;
}

export interface SpaceField extends LayoutBase {
  type: "space";
  size?: "sm" | "md" | "lg";
}

export interface SubmitField extends LayoutBase {
  type: "submit";
  label: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "secondary" | "outline";
}

export interface CustomFieldProps<TValues extends FieldValues> {
  id: string;
  name: FieldPath<TValues>;
  control: Control<TValues>;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  describedBy?: string | undefined;
}

export interface CustomField<TValues extends FieldValues> extends FieldBase<TValues> {
  type: "custom";
  load: () => Promise<{ default: ComponentType<CustomFieldProps<TValues>> }>;
}

export type WizardField<TValues extends FieldValues> =
  | TextField<TValues>
  | NumberField<TValues>
  | TextareaField<TValues>
  | DateField<TValues>
  | DateRangeField<TValues>
  | MonthField<TValues>
  | SelectField<TValues>
  | CheckboxField<TValues>
  | RadioField<TValues>
  | SwitchField<TValues>
  | SliderField<TValues>
  | TimeField<TValues>
  | UploadField<TValues>
  | ImageField<TValues>
  | SignatureField<TValues>
  | RichTextField<TValues>
  | LabelField
  | SpaceField
  | SubmitField
  | CustomField<TValues>;

export type CoreWizardField<TValues extends FieldValues> =
  | TextField<TValues> | NumberField<TValues> | TextareaField<TValues>
  | DateField<TValues> | DateRangeField<TValues> | MonthField<TValues>
  | SelectField<TValues> | CheckboxField<TValues>;

export type ExtendedWizardField<TValues extends FieldValues> = Exclude<WizardField<TValues>, CoreWizardField<TValues>>;
