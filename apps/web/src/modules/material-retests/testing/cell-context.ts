import { createContext } from "react";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import type { CellDefinition } from "./worksheet-model";
export const WorksheetCellContext = createContext<{ definitions: CellDefinition[]; equipment: SelectOption[]; reagents: SelectOption[]; instanceId: string; require: string } | null>(null);
