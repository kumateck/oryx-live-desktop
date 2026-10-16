import { createContext, useContext } from "react";
import type { FormField } from "./form-model";

/** The fields of the form being answered, so a custom answer control can find its question by field id. */
export const AnswerFieldsContext = createContext<ReadonlyMap<string, FormField>>(new Map());
export const useAnswerField = (fieldId: string) => useContext(AnswerFieldsContext).get(fieldId) ?? null;
