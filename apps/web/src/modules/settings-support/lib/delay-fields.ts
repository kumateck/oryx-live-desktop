import { InputTypes } from "@/shared/forms/input-types";
import type { WizardField } from "@/shared/forms/form-wizard";
import type { DelayValues } from "../lib/duration";

export const delayFields = [
  { type: InputTypes.NUMBER, name: "delay.days", label: "Days", min: 0, max: 10675199, step: 1, required: true },
  { type: InputTypes.NUMBER, name: "delay.hours", label: "Hours", min: 0, max: 23, step: 1, required: true },
  { type: InputTypes.NUMBER, name: "delay.minutes", label: "Minutes", min: 0, max: 59, step: 1, required: true },
  { type: InputTypes.TEXT, name: "delay.seconds", label: "Seconds", required: true, description: "0–59; fractions are supported." },
] as const satisfies readonly WizardField<{ delay: DelayValues }>[];
