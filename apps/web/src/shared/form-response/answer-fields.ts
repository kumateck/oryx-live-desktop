import type { FieldValues } from "react-hook-form";
import type { PersistedAttachment, SelectLoader, WizardField } from "@/shared/forms/form-wizard-types";
import { InputTypes } from "@/shared/forms/input-types";
import { QuestionType, specificationReferences } from "@/shared/questions/question-types";
import { growthOptions, organisms } from "@/shared/microbial/microbial-values";
import { acceptedAnswerFiles } from "./answers";
import type { FormField } from "./form-model";

const loadTable = () => import("./fields/table-answer-field");
const loadFormula = () => import("./fields/formula-answer-field");
const loadMicrobial = () => import("./fields/microbial-answer-field");

/** The control an analyst answers a question with. Choices are offered as the option text, which is what is stored. */
export function answerWizardField(field: FormField, loadEquipment: SelectLoader, options: { label?: string; disabled?: boolean; persisted?: readonly PersistedAttachment[] } = {}): WizardField<FieldValues> {
  const { question } = field;
  const base = { name: field.id, label: options.label ?? question.label, required: field.required, disabled: options.disabled ?? false, ...(field.description ?? question.description ? { description: field.description ?? question.description ?? "" } : {}) };
  const choices = question.options.map((name) => ({ value: name, label: name }));
  switch (question.type) {
    case QuestionType.LongAnswer: case QuestionType.Paragraph: return { ...base, type: InputTypes.RICHTEXT };
    case QuestionType.Datepicker: return { ...base, type: InputTypes.DATE };
    case QuestionType.SingleChoice: return { ...base, type: InputTypes.RADIO, options: choices };
    case QuestionType.Dropdown: return { ...base, type: InputTypes.SELECT, mode: "single", source: "sync", options: choices };
    case QuestionType.Checkbox: return { ...base, type: InputTypes.SELECT, mode: "multiple", source: "sync", options: choices };
    case QuestionType.FileUpload: return { ...base, type: InputTypes.UPLOAD, mode: "multiple", accept: acceptedAnswerFiles, persisted: options.persisted ?? [], maxSizeBytes: 20 * 1024 * 1024 };
    case QuestionType.Signature: return { ...base, type: InputTypes.SIGNATURE };
    case QuestionType.Specification: return { ...base, type: InputTypes.SELECT, mode: "single", source: "sync", options: specificationReferences };
    case QuestionType.Equipment: return { ...base, type: InputTypes.SELECT, mode: "single", source: "async", loadOptions: loadEquipment, placeholder: "Select equipment" };
    case QuestionType.Instrument: return { ...base, type: InputTypes.SELECT, mode: "multiple", source: "async", loadOptions: loadEquipment, placeholder: "Select instruments" };
    case QuestionType.Table: return { ...base, type: InputTypes.CUSTOM, load: loadTable };
    case QuestionType.Formula: return { ...base, type: InputTypes.CUSTOM, load: loadFormula };
    case QuestionType.Organism: return { ...base, type: InputTypes.SELECT, mode: "single", source: "sync", options: organisms.map((item) => ({ value: item.value, label: item.label })) };
    case QuestionType.GrowthObservation: return { ...base, type: InputTypes.RADIO, options: growthOptions.map((item) => ({ ...item })) };
    case QuestionType.Dilution: case QuestionType.Incubation: case QuestionType.ColonyCount: return { ...base, type: InputTypes.CUSTOM, load: loadMicrobial };
    // Calculated by the server; shown, never typed.
    case QuestionType.CfuCalculation: return { ...base, required: false, disabled: true, type: InputTypes.CUSTOM, load: loadMicrobial };
    default: return { ...base, type: InputTypes.TEXT, placeholder: question.label };
  }
}
