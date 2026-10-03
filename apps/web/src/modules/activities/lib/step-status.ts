/** Where a step, or a whole production run, stands. The numbers are the backend's. */
export const stepStatus = { new: 0, inProgress: 1, completed: 2, delayed: 3, cancelled: 4 } as const;
const labels = ["Not started", "In progress", "Completed", "Delayed", "Cancelled"] as const;
export function stepStatusLabel(status: number | null | undefined): string { return typeof status === "number" ? labels[status] ?? "Unknown" : "Unknown"; }

/** What a responsible person is asked to do at a step. The numbers are the backend's. */
export const stepAction = { bmr: 0, stockRequisition: 1, fullReturn: 2, extraMaterial: 3, finalPacking: 4, finishedGoods: 5, dispatch: 6, atr: 7 } as const;
const actionLabels = ["BMR and BPR requisition", "Stock requisition", "Full return", "Extra material request", "Final packing", "Finished goods transfer", "Dispatch", "Analytical test request"] as const;
export function stepActionLabel(action: number | null | undefined): string { return typeof action === "number" ? actionLabels[action] ?? "Other" : "Other"; }

const requisition = ["New", "Pending", "Sourced", "Completed", "Rejected"] as const;
export function requisitionStatusLabel(status: number | null | undefined): string { return typeof status === "number" ? requisition[status] ?? "Unknown" : "Unknown"; }
const bmr = ["Requested", "Issued"] as const;
export function bmrStatusLabel(status: number | null | undefined): string { return typeof status === "number" ? bmr[status] ?? "Unknown" : "Unknown"; }
export const extraMaterialStatus = { pending: 0, inProgress: 1, approved: 2 } as const;

const atr = ["New", "Sampled", "Acknowledged", "Testing", "Test taken", "Released", "Assigned", "Rejected"] as const;
export function atrStatusLabel(status: number | null | undefined): string { return typeof status === "number" ? atr[status] ?? "Raised" : "Raised"; }
const stages = ["Intermediate", "Bulk", "Finished"] as const;
export function testStageLabel(stage: number): string { return stages[stage] ?? "Unknown stage"; }
const extraMaterial = ["Waiting for approval", "Being issued", "Approved"] as const;
export function extraMaterialStatusLabel(status: number): string { return extraMaterial[status] ?? "Unknown"; }
