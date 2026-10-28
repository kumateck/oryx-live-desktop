import { useRef, useState } from "react";
import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/shared/actions";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { ResultSheet } from "@/shared/reports/report-sheet";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { attendanceUploadApi } from "../api/attendance-api";
import { attendanceUploadSchema, type AttendanceUploadValues } from "../schemas/upload-schema";
import { useAttendancePreview } from "../hooks/use-attendance-preview";
const require = "CanSubmitAttendanceReportUpload";
const fields: WizardField<AttendanceUploadValues>[] = [{ type: InputTypes.DATE, name: "date", label: "Attendance date", required: true }, { type: InputTypes.UPLOAD, name: "file", label: "Attendance workbook", mode: "single", accept: ".xlsx", maxSizeBytes: 5 * 1024 * 1024, required: true }];
export function AttendanceUploadPage() {
  const form = useForm<AttendanceUploadValues>({ resolver: zodResolver(attendanceUploadSchema), defaultValues: { date: new Date(), file: null } });
  const [file, date] = useWatch({ control: form.control, name: ["file", "date"] }); const preview = useAttendancePreview(file, date);
  const permission = usePermissionAction(require); const guard = useRef(false); const [review, setReview] = useState<AttendanceUploadValues | null>(null); const [saved, setSaved] = useState(false); const [error, setError] = useState("");
  const [upload, mutation] = attendanceUploadApi.useUploadAttendanceFileMutation();
  const submit = form.handleSubmit((values) => {
    const denied = permission.check(); if (denied) { setError(denied); return; }
    if (!preview.preview || preview.error || preview.busy) { setError("Wait for a valid workbook preview before reviewing the upload."); return; }
    setError(""); setReview(values);
  });
  const confirm = async () => {
    if (guard.current || !review?.file) return "The reviewed workbook is unavailable.";
    const denied = permission.check(); if (denied) return denied;
    guard.current = true;
    try {
      const date = `${review.date.getFullYear()}-${String(review.date.getMonth() + 1).padStart(2, "0")}-${String(review.date.getDate()).padStart(2, "0")}T00:00:00Z`;
      const result = await upload({ file: review.file, date }); if ("error" in result) return `${apiErrorMessage(result.error)} If the response was lost, inspect the attendance summary before submitting again.`;
      setSaved(true); return null;
    } finally { guard.current = false; }
  };
  return <article className="space-y-5"><PageHeader title="Upload daily attendance" crumbs={[{ label: "Human resources" }, { label: "Attendance upload" }]} />
    <p className="text-sm text-muted-foreground">Review the first worksheet before import. Required positions: staff number in column 1, timestamp (dd/MM/yyyy HH:mm:ss) in column 3, CheckIn/CheckOut in column 4. The server validates employees and records attendance for the selected date.</p>
    {saved ? <div role="status" className="space-y-3"><p>Attendance import accepted by the server. Review the summary to verify its effect.</p><Button asChild><Link to="/hr/attendance-report-summary">View attendance summary</Link></Button></div> : <form noValidate onSubmit={submit} className="space-y-4"><fieldset disabled={mutation.isLoading || !permission.allowed} className="grid gap-4 sm:grid-cols-2"><FormWizard form={form} fields={fields} /></fieldset>
      {preview.busy ? <Skeleton className="h-40 w-full" /> : preview.preview ? <ResultSheet sheet={preview.preview.sheet} /> : null}
      {preview.error ? <p role="alert" className="text-destructive">{preview.error}</p> : null}{error ? <p role="alert" className="text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-3"><Button disabled={!permission.allowed || mutation.isLoading || preview.busy || !preview.preview}>Review attendance import</Button><Button type="button" variant="outline" disabled={mutation.isLoading} onClick={() => { form.reset({ date: new Date(), file: null }); setError(""); }}>Clear selection</Button></div>
    </form>}
    {review ? <ConfirmActionDialog require={require} destructive={false} title="Import this attendance workbook?" description={`${preview.preview?.sheet.rows.length ?? 0} workbook rows for ${review.date.toLocaleDateString()}. The server replaces matching timestamp/work-state records and may notify the department. This does not process payroll.`} confirmLabel="Import attendance" busyLabel="Importing…" onConfirm={confirm} onClose={() => setReview(null)} /> : null}
  </article>;
}
