import type { WizardField, SelectPage } from "@/shared/forms/form-wizard-types";
import { InputTypes as I } from "@/shared/forms/input-types";
import { LeaveCategory } from "../lib/leave";
import type { LeaveValues } from "../schemas/leave-schema";
export function leaveFields(
  category: 0 | 1 | 2 | 3,
  editing: boolean,
  loader: (kind: "employee" | "type", search: string, page: number, signal: AbortSignal) => Promise<SelectPage>,
): WizardField<LeaveValues>[] {
  return [
    {
      type: I.SELECT,
      name: "employee",
      label: "Employee",
      mode: "single",
      source: "async",
      required: true,
      disabled: editing,
      loadOptions: (search, page, signal) => loader("employee", search, page, signal),
    },
    {
      type: I.SELECT,
      name: "leaveType",
      label: "Leave type",
      mode: "single",
      source: "async",
      required: editing || category === LeaveCategory.Leave || category === LeaveCategory.Absence,
      loadOptions: (search, page, signal) => loader("type", search, page, signal),
      description:
        editing && category >= 2
          ? "The current server requires a leave type for updates. Existing types must match the employee's designation."
          : "Only active types assigned to the employee's designation are offered.",
    },
    { type: I.DATE, name: "from", label: "Start date", required: true },
    { type: I.DATE, name: "to", label: "End date", required: true },
    { type: I.TEXT, name: "contactPerson", label: "Contact person", required: category === LeaveCategory.Absence },
    { type: I.TEXT, name: "contactPhone", label: "Contact phone number", required: category === LeaveCategory.Absence },
    { type: I.TEXT, name: "destination", label: "Destination", required: category === LeaveCategory.OfficialDuty },
    { type: I.TEXTAREA, name: "justification", label: "Justification", rows: 4, className: "sm:col-span-2" },
    {
      type: I.UPLOAD,
      name: "files",
      label: "Supporting attachments",
      mode: "multiple",
      maxSizeBytes: 16 * 1024 * 1024,
      className: "sm:col-span-2",
      description: "Files are attached after the request is saved. Existing attachments remain available in the shared read-only viewer.",
    },
  ];
}
