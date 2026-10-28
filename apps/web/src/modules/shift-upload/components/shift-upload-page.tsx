import { useCallback, useState } from "react";
import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes as I } from "@/shared/forms/input-types";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import { hrApi } from "@/shared/api/generated/hr";
import { PageHeader } from "@/shared/navigation/page-header";
import { ConfirmActionDialog } from "@/shared/actions";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { ResultSheet } from "@/shared/reports/report-sheet";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { scheduleSchema, audit, type Schedule } from "@/shared/shifts/contracts";
import type { ShiftPreview } from "../lib/workbook";
import { useShiftPreview } from "../hooks/use-preview";
import { uploadRequirement, useUploadCommand } from "../hooks/use-upload-command";
const schema = z.object({ schedule: z.object({ value: z.uuid(), label: z.string() }).nullable(), file: z.instanceof(File).nullable() }).superRefine((v, c) => {
  if (!v.schedule) c.addIssue({ code: "custom", path: ["schedule"], message: "Choose a schedule." });
  if (!v.file) c.addIssue({ code: "custom", path: ["file"], message: "Choose an XLSX workbook." });
});
function Upload() {
  const dispatch = useApiDispatch();
  const command = useUploadCommand();
  const [error, setError] = useState("");
  const [review, setReview] = useState<{ file: File; schedule: Schedule; preview: ShiftPreview } | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { schedule: null, file: null } });
  const file = useWatch({ control: form.control, name: "file" });
  const preview = useShiftPreview(file);
  const load = useCallback(
    async (searchQuery: string, page: number, signal: AbortSignal) => {
      const request = dispatch(
        hrApi.endpoints.getApiV1ShiftSchedules.initiate({ ...audit, searchQuery, page, pageSize: 30 }, { subscribe: false, forceRefetch: true }),
      );
      const abort = () => request.abort();
      signal.addEventListener("abort", abort, { once: true });
      try {
        const data = await request.unwrap();
        return {
          options: (data.data ?? []).flatMap((r) =>
            r.id ? [{ value: r.id, label: `${r.scheduleName} · ${r.department?.name ?? "Department not recorded"}` }] : [],
          ),
          hasNext: (data.pageIndex ?? page) < (data.pageCount ?? page),
          hasPrevious: page > 1,
        };
      } finally {
        signal.removeEventListener("abort", abort);
      }
    },
    [dispatch],
  );
  const fields: WizardField<z.infer<typeof schema>>[] = [
    { type: I.SELECT, name: "schedule", label: "Shift schedule and department", mode: "single", source: "async", loadOptions: load, required: true },
    { type: I.UPLOAD, name: "file", label: "Shift workbook", mode: "single", accept: ".xlsx", maxSizeBytes: 5 * 1024 * 1024, required: true },
  ];
  return (
    <article className="space-y-4">
      <PageHeader title="Import shift schedule" crumbs={[{ label: "Human resources" }, { label: "Shift upload" }]} />
      <p className="text-muted-foreground">
        Use the department employee template and fill STAFF ID, CATEGORY and SHIFT TYPE in the first worksheet. One row per employee. Assignments cover every
        calendar date in the selected schedule; its department is used for import.
      </p>
      {command.result ? (
        <div role="status" className="space-y-2">
          <p>{command.result}</p>
          <Button asChild>
            <Link to="/plan-shift">View shift plans</Link>
          </Button>
        </div>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit(async (v) => {
            if (!v.schedule || !v.file || !preview.data || preview.busy || preview.error) return;
            const request = dispatch(
              hrApi.endpoints.getApiV1ShiftSchedulesById.initiate({ ...audit, id: v.schedule.value }, { subscribe: false, forceRefetch: true }),
            );
            try {
              const schedule = scheduleSchema.parse(await request.unwrap());
              setError("");
              setReview({ file: v.file, schedule, preview: structuredClone(preview.data) });
            } catch {
              setError("The selected schedule could not be verified. Retry before reviewing this import.");
            }
          })}
        >
          <fieldset disabled={command.busy || !command.allowed} className="grid gap-4 sm:grid-cols-2">
            <FormWizard form={form} fields={fields} />
          </fieldset>
          {preview.busy ? <Skeleton className="h-40" /> : preview.data ? <ResultSheet sheet={preview.data.sheet} /> : null}
          {preview.error || error ? (
            <p role="alert" className="text-destructive">
              {preview.error || error}
            </p>
          ) : null}
          <Button disabled={command.busy || !command.allowed || !preview.data || preview.busy}>Review shift import</Button>
        </form>
      )}
      {review ? (
        <ConfirmActionDialog
          require={uploadRequirement}
          destructive={false}
          title="Import these shift assignments?"
          description={`${review.preview.rows.length} employees for ${review.schedule.scheduleName}, ${review.schedule.department?.name ?? review.schedule.departmentId}, ${review.schedule.startDate.slice(0, 10)} – ${review.schedule.endDate.slice(0, 10)}. The server may notify the department. Live will reconcile every imported employee/date after the request.`}
          confirmLabel="Import and verify"
          busyLabel="Importing and verifying…"
          onConfirm={() => command.run(review.file, review.schedule, review.preview)}
          onClose={() => setReview(null)}
        />
      ) : null}
    </article>
  );
}
export function ShiftUploadPage() {
  return (
    <PermissionGuard
      require={{ kind: "all", permissions: ["CanViewShiftSchedule", "CanViewDepartmentEmployee", "CanViewShiftCategories", "CanViewWorkingHoursPolicy"] }}
      fallback={<p role="alert">Schedule, department employee, category and working-hours policy read access is required to validate a shift import.</p>}
    >
      <Upload />
    </PermissionGuard>
  );
}
