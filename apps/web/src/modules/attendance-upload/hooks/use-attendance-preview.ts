import { useEffect, useState } from "react";
import type { AttendancePreview } from "../lib/attendance-workbook";
import { previewAttendance } from "../lib/attendance-workbook";
interface PreviewState { file: File; day: string; preview: AttendancePreview | null; error: string | null }
export function useAttendancePreview(file: File | null, date: Date) {
  const day = Number.isFinite(date?.getTime()) ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "";
  const [result, setResult] = useState<PreviewState | null>(null);
  useEffect(() => {
    if (!file || !day) return;
    const controller = new AbortController();
    previewAttendance(file, date, controller.signal).then((preview) => { if (!controller.signal.aborted) setResult({ file, day, preview, error: null }); }, (reason) => { if (!controller.signal.aborted) setResult({ file, day, preview: null, error: reason instanceof Error ? reason.message : "The workbook could not be previewed." }); });
    return () => controller.abort();
  }, [file, day, date]);
  const current = result?.file === file && result.day === day ? result : null;
  return { preview: current?.preview ?? null, error: current?.error ?? null, busy: Boolean(file && day && !current) };
}
