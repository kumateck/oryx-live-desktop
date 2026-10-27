import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import type { ReportFilters } from "../schemas/report-filters";
export function ReportFilterDialog({ title, open, onOpenChange, form, fields, submit, reset }: {
  title: string; open: boolean; onOpenChange: (open: boolean) => void; form: UseFormReturn<ReportFilters>; fields: WizardField<ReportFilters>[];
  submit: (values: ReportFilters) => void; reset: () => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-3xl">
    <DialogHeader><DialogTitle>Filters · {title}</DialogTitle><DialogDescription>Leave an optional selection empty to include all matching records. Generate to apply these filters.</DialogDescription></DialogHeader>
    <form onSubmit={form.handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col gap-4">
      <DialogBody><FormWizard form={form} fields={fields} className="sm:grid-cols-2" /></DialogBody>
      <DialogFooter className="flex-wrap"><Button type="button" variant="ghost" onClick={reset}>Reset filters</Button><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Generate report</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
