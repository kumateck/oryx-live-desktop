/**
 * Field types a FormWizard form can declare. Names follow Oryx Next's `InputTypes` so forms carry
 * over with the same vocabulary: write `type: InputTypes.TEXT`, never the bare string.
 *
 * Oryx Next's select variants (ASYNC_SELECT, MULTI, ASYNC_MULTI, PAGINATED_SELECT, SPECIAL_SELECT,
 * USER_SELECT) are one type here: `SELECT` with `mode: "single" | "multiple"` and
 * `source: "sync" | "async"`. `CUSTOM` loads a module's own control. Types Oryx Next has that are
 * not built yet (BUTTON, COLOR, DRAGNDROP, Formula, NUMBERS, OTP, PHONE, TABLE) are added here
 * when their field is.
 */
export const InputTypes = {
  CHECKBOX: "checkbox",
  CLOCK: "clock",
  CUSTOM: "custom",
  DATE: "date",
  EMAIL: "email",
  IMAGE: "image",
  LABEL: "label",
  MOMENT: "moment",
  MONTH: "month",
  NUMBER: "number",
  PASSWORD: "password",
  RADIO: "radio",
  RANGE: "daterange",
  RICHTEXT: "richtext",
  SELECT: "select",
  SIGNATURE: "signature",
  SLIDER: "slider",
  SPACE: "space",
  SUBMIT: "submit",
  SWITCH: "switch",
  TEXT: "text",
  TEXTAREA: "textarea",
  TIME: "time",
  UPLOAD: "upload",
} as const;

export type InputType = (typeof InputTypes)[keyof typeof InputTypes];
