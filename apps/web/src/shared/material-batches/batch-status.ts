/** Backend BatchStatus contract, also used by Oryx Next. Never infer quality from missing data. */
export enum BatchStatus {
  Received = 0,
  Quarantine = 1,
  Testing = 2,
  Available = 3,
  Rejected = 4,
  Retest = 5,
  Frozen = 6,
  Consumed = 7,
  Approved = 8,
  TestTaken = 9,
  Checked = 10,
  Sampled = 11,
  TestAssigned = 12,
}

export const batchStatusLabels: Record<number, string> = {
  [BatchStatus.Received]: "Received",
  [BatchStatus.Quarantine]: "Quarantine",
  [BatchStatus.Testing]: "Testing",
  [BatchStatus.Available]: "Available",
  [BatchStatus.Rejected]: "Rejected",
  [BatchStatus.Retest]: "Retest",
  [BatchStatus.Frozen]: "Frozen",
  [BatchStatus.Consumed]: "Consumed",
  [BatchStatus.Approved]: "Approved",
  [BatchStatus.TestTaken]: "Test taken",
  [BatchStatus.Checked]: "Checked",
  [BatchStatus.Sampled]: "Sampled",
  [BatchStatus.TestAssigned]: "Test assigned",
};

export function batchStatusLabel(status: number | null): string {
  return Object.entries(batchStatusLabels).find(([value]) => Number(value) === status)?.[1]
    ?? (status === null ? "Not recorded" : `Unknown (${status})`);
}
