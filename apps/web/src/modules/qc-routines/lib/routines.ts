import { z } from "zod";

// Routine quality control: scheduled and emergency water and environmental monitoring, each sample tested by
// chemical and/or microbial worksheets, then certified. The numbers are the backend's.
export const RoutineType = { Water: 0, Environmental: 1 } as const;
export const AnalysisType = { Chemical: 0, Microbial: 1 } as const;
export const RoutineOrigin = { Scheduled: 0, Emergency: 1 } as const;
export const RoutineCadence = { Monthly: 0, Quarterly: 1 } as const;
export const RoutineStatus = { Planned: 0, InProgress: 1, Submitted: 2, Approved: 3, Rejected: 4 } as const;
export const RequirementSubject = { Material: 0, Product: 1 } as const;
export const typeLabel = (type: number) => type === RoutineType.Environmental ? "Environmental monitoring" : "Water";
export const analysisLabel = (type: number) => type === AnalysisType.Microbial ? "Microbial" : "Chemical";
export const originLabel = (origin: number) => origin === RoutineOrigin.Emergency ? "Event-triggered emergency" : "Scheduled";
export const cadenceLabel = (cadence: number | null) => cadence === RoutineCadence.Quarterly ? "Quarterly" : cadence === RoutineCadence.Monthly ? "Monthly" : "–";
const statusLabels: Record<number, string> = { 0: "Planned", 1: "In progress", 2: "Submitted", 3: "Approved", 4: "Rejected" };
export const statusLabel = (status: number) => statusLabels[status] ?? "Unknown";
export const typeOptions = [{ value: "0", label: "Water" }, { value: "1", label: "Environmental monitoring" }] as const;
export const analysisOptions = [{ value: "0", label: "Chemical analysis" }, { value: "1", label: "Microbial analysis" }] as const;
export const originOptions = [{ value: "0", label: "Scheduled" }, { value: "1", label: "Event-triggered emergency" }] as const;
export const cadenceOptions = [{ value: "0", label: "Monthly" }, { value: "1", label: "Quarterly" }] as const;

export const audit = { module: "Quality Control", subModule: "Routine Tests" } as const;
export const setupAudit = { module: "Quality Control", subModule: "Routine Test Setup" } as const;
export const waterAudit = { module: "Quality Control", subModule: "Water Quality Coverage" } as const;
export const microbialAudit = { module: "Quality Control", subModule: "Microbial Analysis Setup" } as const;

export const routinesPath = "/qc/routines";
export const setupPath = `${routinesPath}/setup`;
export const waterPath = `${routinesPath}/water-quality`;
export const routinePath = (id: string) => `${routinesPath}/${id}`;
export const trackPath = (id: string) => `${routinesPath}/tracks/${id}`;
export const certificatePath = (id: string) => `${routinesPath}/certificates/${id}`;

/** The server checks no permission on these endpoints; the keys Oryx Next defined gate every screen and action here. */
export const routinePermissions = {
  view: "CanViewQcRoutineTests", create: "CanCreateQcRoutineTest", perform: "CanPerformQcRoutineTest",
  setupView: "CanViewQcRoutineSetup", setupManage: "CanManageQcRoutineSetup", microbial: "CanManageQcMicrobialRequirements",
  waterView: "CanViewQcRoutineWaterQuality", waterManage: "CanManageQcRoutineWaterQuality",
} as const;

/** The calendar month or quarter containing a date, which is what a scheduled routine's period must be. */
export function calendarPeriod(date: Date, months: 1 | 3) {
  const startMonth = Math.floor(date.getUTCMonth() / months) * months;
  return { periodStart: new Date(Date.UTC(date.getUTCFullYear(), startMonth, 1)).toISOString(), periodEnd: new Date(Date.UTC(date.getUTCFullYear(), startMonth + months, 1)).toISOString() };
}

const text = z.string().nullish().transform((value) => value?.trim() ? value.trim() : null);
const num = z.number().nullish().transform((value) => value ?? null);
export const trackSchema = z.object({ id: z.string(), analysisType: z.number(), routineArdId: z.string(), formId: z.string(), responseId: text,
  approved: z.boolean().nullish().transform((value) => value === true), rejected: z.boolean().nullish().transform((value) => value === true) });
export type Track = z.infer<typeof trackSchema>;
export const sampleSchema = z.object({ id: z.string(), samplingPoint: text, areaName: text, collectedAt: text, tracks: z.array(trackSchema).nullish().transform((value) => value ?? []) });
export type Sample = z.infer<typeof sampleSchema>;
export const executionSchema = z.object({
  id: z.string(), routineCode: text, origin: z.number(), type: z.number(), cadence: num, routineDate: text, periodStart: text, periodEnd: text,
  emergencyTrigger: text, emergencyReason: text, rndTrialBatchId: text, doneById: text, doneAt: text, status: z.number(),
  samples: z.array(sampleSchema).nullish().transform((value) => value ?? []),
}).transform((value) => ({ ...value, code: value.routineCode ?? "Routine" }));
export type Execution = z.infer<typeof executionSchema>;
export const trackContextSchema = z.object({
  id: z.string(), routineExecutionId: z.string(), routineCode: text, routineSampleId: z.string(), sampleIdentity: text, analysisType: z.number(),
  formId: z.string(), routineArdId: z.string(), responseId: text,
  approved: z.boolean().nullish().transform((value) => value === true), rejected: z.boolean().nullish().transform((value) => value === true),
});
export type TrackContext = z.infer<typeof trackContextSchema>;
export const definitionSchema = z.object({ id: z.string(), name: text, type: z.number(), cadence: z.number(), isActive: z.boolean().nullish().transform((value) => value !== false) });
export type Definition = z.infer<typeof definitionSchema>;
export const coaItemSchema = z.object({ formFieldId: z.string(), includeOnCoa: z.boolean().nullish().transform((value) => value !== false), displayLabel: text, groupName: text,
  specificationText: text, unit: text, reference: text, displayOrder: z.number().nullish().transform((value) => value ?? 0) });
export const routineArdSchema = z.object({ id: z.string(), type: z.number(), analysisType: z.number(), formId: z.string(), specNumber: text,
  isVerified: z.boolean().nullish().transform((value) => value === true), coaItems: z.array(coaItemSchema).nullish().transform((value) => value ?? []) });
export type RoutineArd = z.infer<typeof routineArdSchema>;
export const requirementSchema = z.object({ id: z.string(), subject: z.number(), materialId: text, productId: text, subjectName: text, stage: num,
  required: z.boolean().nullish().transform((value) => value === true), reason: text, isVerified: z.boolean().nullish().transform((value) => value === true), verifiedAt: text });
export type Requirement = z.infer<typeof requirementSchema>;

/** A certificate's rows, frozen when it was issued. Commercial certificates store them with capitalised keys. */
const rowSchema = z.record(z.string(), z.unknown()).transform((row) => {
  const pick = (...keys: string[]) => { for (const key of keys) { const value = row[key]; if (value !== undefined && value !== null) return String(value); } return null; };
  const analysis = Number(pick("analysisType", "AnalysisType") ?? 0);
  return { analysisType: analysis, sampleIdentity: pick("sampleIdentity", "SampleIdentity"), label: pick("displayLabel", "DisplayLabel") ?? "Test", group: pick("groupName", "GroupName"),
    specification: pick("specificationText", "SpecificationText") ?? "", unit: pick("unit", "Unit"), reference: pick("reference", "Reference"), result: pick("result", "Result") ?? "",
    key: `${pick("trackId", "TrackId") ?? ""}/${pick("formFieldId", "FormFieldId") ?? ""}/${String(analysis)}` };
});
export type CertificateRow = z.infer<typeof rowSchema>;
export function certificateRows(json: string | null): CertificateRow[] | null {
  if (!json) return [];
  try { const parsed = z.array(rowSchema).safeParse(JSON.parse(json)); return parsed.success ? parsed.data : null; } catch { return null; }
}
export const certificateSchema = z.object({ id: z.string(), routineExecutionId: text, routineSampleId: text, certificateCode: text,
  combined: z.boolean().nullish().transform((value) => value === true), rowsJson: text, issuedAt: text, target: num, materialSamplingId: text, analyticalTestRequestId: text });
export type Certificate = z.infer<typeof certificateSchema>;

export const WaterStatus = { Active: 0, Held: 1 } as const;
export const periodSchema = z.object({ id: z.string(), routineCertificateId: text, routineSampleId: text, samplingPoint: text, validFrom: text, validUntil: text, status: z.number(),
  retrospectiveReason: text, approvedAt: text, holdReason: text, heldAt: text, useRecordCount: z.number().nullish().transform((value) => value ?? 0) });
export type Period = z.infer<typeof periodSchema>;

/** Where a worksheet track stands. */
export function trackState(track: { approved: boolean; rejected: boolean; responseId: string | null }) {
  return track.rejected ? { label: "Rejected", tone: "destructive" as const } : track.approved ? { label: "Approved", tone: "default" as const }
    : track.responseId ? { label: "Worksheet started", tone: "secondary" as const } : { label: "Awaiting worksheet", tone: "outline" as const };
}
export const sampleReady = (sample: Sample) => sample.tracks.length > 0 && sample.tracks.every((track) => track.approved && !track.rejected);
/** An environmental routine is certified once, when every area has its single microbial track approved. */
export const environmentalReady = (run: Execution) => run.type === RoutineType.Environmental && run.samples.length > 0 && run.samples.every((sample) => sample.tracks.length === 1 && sampleReady(sample));
