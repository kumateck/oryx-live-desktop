export const atrPath = "/atr";
export const atrListPath = (status: number) => `${atrPath}?type=${String(status)}`;
export const atrStepPath = (id: string, step: "" | "assign" | "reassign" | "test" = "") => `${atrPath}/${id}${step ? `/${step}` : ""}`;
export const atrAudit = { module: "Quality Assurance", subModule: "Analytical Raw Data" } as const;
export const atrPermissions = {
  sample: "CanTakeSamples", acknowledge: "CanAcknowledgeSampleTaken", assign: "CanAssignProductTest", start: "CanStartProductTest", reassign: "CanReassignProductTest",
  check: "CanCheckProductTest", requestRetest: "CanRequestRetestProductTest", completeRetest: "CanCompleteRetestProductTest",
} as const;

/** Where a request stands. The numbers are the server's. */
export const AtrStatus = { New: 0, Sampled: 1, Acknowledged: 2, Testing: 3, TestTaken: 4, Released: 5, Assigned: 6, Rejected: 7 } as const;
export const atrStatusLabels: Record<number, string> = { 0: "New", 1: "Sampled", 2: "Acknowledged", 3: "Under test", 4: "Test taken", 5: "Released", 6: "Assigned", 7: "Rejected" };
/** QC's queues, in the order a request moves through them. QA works only on new requests. */
export const qcQueues = [AtrStatus.Sampled, AtrStatus.Acknowledged, AtrStatus.Assigned, AtrStatus.Testing, AtrStatus.TestTaken, AtrStatus.Released] as const;
export const stageLabels: Record<number, string> = { 0: "Intermediate", 1: "Bulk", 2: "Finished" };
/** The AR number's type for a production stage: intermediate, bulk or finished product. */
export const stageCode = (stage: number | null): "IP" | "BP" | "FP" => stage === 0 ? "IP" : stage === 1 ? "BP" : "FP";

export type AtrAction = "sample" | "acknowledge" | "assign" | "start" | "continue" | "reassign" | "assignments" | "check" | "requestRetest" | "completeRetest" | "print";
export function atrActions(status: number | null, isRetest: boolean, hasAssignees: boolean): ReadonlySet<AtrAction> {
  const S = AtrStatus;
  const actions = new Set<AtrAction>();
  if (status === S.New) actions.add("sample");
  if (status === S.Sampled) actions.add("acknowledge");
  if (status === S.Acknowledged || status === S.Testing) actions.add("assign");
  if (status === S.Assigned) actions.add("start");
  if (status === S.Testing && !isRetest) actions.add("continue");
  if ((status === S.Assigned || status === S.Testing) && hasAssignees) actions.add("reassign");
  if (status !== null && status !== S.New && status !== S.Sampled && status !== S.Acknowledged) actions.add("assignments");
  if (status === S.TestTaken) actions.add("check");
  if (status === S.Released) actions.add("requestRetest");
  if (status === S.Testing && isRetest) actions.add("completeRetest");
  if (status === S.Testing || status === S.TestTaken || status === S.Released) actions.add("print");
  return actions;
}
export const atrPrintsFilled = (status: number | null) => status === AtrStatus.TestTaken || status === AtrStatus.Released;
