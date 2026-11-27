import { AnalysisType, type CertificateRow } from "@/modules/qc-routines/lib/routines";

/** One numbered test on the certificate: a single result, or a heading with its results beneath it. */
export interface CertificateEntry {
  number: number;
  /** The test's name; for a group, the group's name ("Identification", "Microbial"). */
  label: string;
  /** Sub-rows under the heading. Empty when the test is a single row. */
  lines: CertificateRow[];
  /** The test's own row when it is not a group. */
  row: CertificateRow | null;
}

/**
 * Lays an issued certificate out as the printed COA reads: chemical tests numbered in order, tests sharing a group
 * (Identification Test A and Test B) under one number, and every microbial test under one last "Microbial" number.
 */
export function certificateLayout(rows: readonly CertificateRow[]): CertificateEntry[] {
  const entries: CertificateEntry[] = [];
  const add = (label: string, row: CertificateRow | null, lines: CertificateRow[]) =>
    entries.push({ number: entries.length + 1, label, row, lines });
  const chemical = rows.filter((row) => row.analysisType !== AnalysisType.Microbial);
  for (let index = 0; index < chemical.length;) {
    const row = chemical[index];
    if (!row) break;
    const group = row.group?.trim();
    if (!group) { add(row.label, row, []); index++; continue; }
    const lines: CertificateRow[] = [];
    while (index < chemical.length && chemical[index]?.group?.trim() === group) {
      const line = chemical[index];
      if (line) lines.push(line);
      index++;
    }
    add(group, null, lines);
  }
  const microbial = rows.filter((row) => row.analysisType === AnalysisType.Microbial);
  if (microbial.length) add("Microbial", null, microbial);
  return entries;
}
