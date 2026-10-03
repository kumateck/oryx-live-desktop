import type { ComponentType } from "react";
import type { DateRange } from "react-day-picker";
import type { MonthRange } from "@/shared/date-pickers/date-utils";
import type { InputTypes } from "./input-types";
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
  type: typeof InputTypes.TEXT | typeof InputTypes.EMAIL | typeof InputTypes.PASSWORD;
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
}

export interface NumberField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, number | null | undefined>> {
  type: typeof InputTypes.NUMBER;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
}

export interface TextareaField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.TEXTAREA;
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
  type: typeof InputTypes.DATE;
}

export interface DateRangeField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, DateRange | null | undefined>>, CalendarBounds {
  type: typeof InputTypes.RANGE;
}

export interface MonthField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.MONTH;
  placeholder?: string;
  minMonth?: string;
  maxMonth?: string;
  fromYear?: number;
  toYear?: number;
}

export interface MonthRangeField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, MonthRange | null | undefined>> {
  type: typeof InputTypes.MONTH_RANGE;
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
  type: typeof InputTypes.SELECT;
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
  type: typeof InputTypes.CHECKBOX;
}

export interface RadioField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.RADIO;
  options: readonly SelectOption[];
}

export interface SwitchField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, boolean | undefined>> {
  type: typeof InputTypes.SWITCH;
}

export interface SliderField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, number | null | undefined>> {
  type: typeof InputTypes.SLIDER;
  min: number;
  max: number;
  step?: number;
}

export interface TimeField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.TIME | typeof InputTypes.CLOCK | typeof InputTypes.MOMENT;
  showDays?: boolean;
  maxDays?: number;
}

export interface PersistedAttachment {
  id: string;
  name: string;
  url?: string;
}

interface UploadBase<TValues extends FieldValues, TName extends FieldPath<TValues>> extends FieldBase<TValues, TName> {
  type: typeof InputTypes.UPLOAD;
  accept?: string;
  maxSizeBytes?: number;
  persisted?: readonly PersistedAttachment[];
  onPersistedChange?: (attachments: readonly PersistedAttachment[]) => void;
}

export type UploadField<TValues extends FieldValues> =
  | (UploadBase<TValues, FieldPathByValue<TValues, File | null | undefined>> & { mode: "single" })
  | (UploadBase<TValues, FieldPathByValue<TValues, readonly File[] | undefined>> & { mode: "multiple" });

export interface ImageField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, File | null | undefined>> {
  type: typeof InputTypes.IMAGE;
  existingUrl?: string;
  onRemoveExisting?: () => void;
  maxSizeBytes?: number;
  previewFit?: "cover" | "contain";
}

export interface SignatureField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.SIGNATURE;
}

export interface RichTextReference {
  id: string;
  label: string;
  kind: "user" | "tag";
}

export interface RichTextField<TValues extends FieldValues> extends FieldBase<TValues, FieldPathByValue<TValues, string | null | undefined>> {
  type: typeof InputTypes.RICHTEXT;
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
  type: typeof InputTypes.LABEL;
  label: string;
  text?: string;
}

export interface SpaceField extends LayoutBase {
  type: typeof InputTypes.SPACE;
  size?: "sm" | "md" | "lg";
}

export interface SubmitField extends LayoutBase {
  type: typeof InputTypes.SUBMIT;
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
  type: typeof InputTypes.CUSTOM;
  load: () => Promise<{ default: ComponentType<CustomFieldProps<TValues>> }>;
}

export type WizardField<TValues extends FieldValues> =
  | TextField<TValues>
  | NumberField<TValues>
  | TextareaField<TValues>
  | DateField<TValues>
  | DateRangeField<TValues>
  | MonthField<TValues>
  | MonthRangeField<TValues>
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
  | DateField<TValues> | DateRangeField<TValues> | MonthField<TValues> | MonthRangeField<TValues>
  | SelectField<TValues> | CheckboxField<TValues>;

export type ExtendedWizardField<TValues extends FieldValues> = Exclude<WizardField<TValues>, CoreWizardField<TValues>>;
