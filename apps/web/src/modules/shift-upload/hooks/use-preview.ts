import { useEffect, useState } from "react";
import { previewShiftWorkbook, type ShiftPreview } from "../lib/workbook";
export function useShiftPreview(file: File | null) {
  const [state, setState] = useState<{ file: File; data: ShiftPreview | null; error: string | null } | null>(null);
  useEffect(() => {
    if (!file) return;
    const controller = new AbortController();
    previewShiftWorkbook(file, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ file, data, error: null });
      },
      (e) => {
        if (!controller.signal.aborted) setState({ file, data: null, error: e instanceof Error ? e.message : "The workbook could not be previewed." });
      },
    );
    return () => controller.abort();
  }, [file]);
  const current = state?.file === file ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? null, busy: !!file && !current };
}
