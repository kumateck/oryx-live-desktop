import { expect, it } from "vitest";
import { activityBoardSchema, activitySchema, type ActivityStep } from "../schemas/activity-schema";
import { activityProgress, duration, stepDuration, stepPosition } from "./activity-progress";
import { atrProblem, atrRequest, configuredTestStage } from "./atr";
import { extraMaterialLines, extraMaterialProblem, extraMaterialRequest } from "./extra-material";
import { materialFigures, materialRequests, packCategory, packingMaterials, returnedMaterials, yieldFigures, yieldTerms } from "./final-packing";
import { fgLayout } from "@/shared/packing/fg-quantity";
import { transferNoteNumber, transferProblem, transferRequest, transferTotals, transferYield } from "./finished-goods";
import { stepPolicy } from "./step-policy";
import { relatedUnits, toSmallestUnit } from "@/shared/units/quantity";
import { requisitionProblem, stockRequisitionRequest } from "./stock-requisition";

const member = (id: string, action: number) => ({ user: { id, firstName: "Ama", lastName: id }, action });
const raw = { id: "a1", status: 1, startedAt: "2026-10-01T08:00:00Z", currentStep: { id: "s3" },
  productionScheduleProduct: { id: "b1", batchNumber: "WM-001", quantity: 1_500_000, batchSize: 0, product: { id: "p1", name: "Wormee", code: "NL-047", baseUoM: { symbol: "ml" } }, productionSchedule: { id: "sch", code: "PS-7" } },
  activityLogs: [{ id: "l1", message: "started dispensing", timestamp: "2026-10-01T09:00:00Z", user: { firstName: "Ama", lastName: "Owusu" } }, { id: "l2", message: "issued stock", timestamp: "2026-10-01T10:00:00Z" }],
  steps: [
    { id: "s3", order: 3, status: 0, isCritical: true, operation: { name: "Dispensing" }, responsibleUsers: [member("u1", 2), member("u1", 3)], workCenters: [{ workCenter: { name: "Dispensary" } }] },
    { id: "s1", order: 1, status: 2, isCritical: false, startedAt: "2026-10-01T08:00:00Z", completedAt: "2026-10-01T08:30:00Z", operation: { name: "BMR" }, responsibleUsers: [member("u2", 0)] },
    { id: "s2", order: 2, status: 2, isCritical: true, operation: { name: "Stock" }, responsibleUsers: [member("u2", 1)] },
    { id: "s4", order: 4, status: 0, isCritical: false, operation: { name: "Mixing" } },
  ] };
const activity = activitySchema.parse(raw);
const step = (id: string, change: Partial<ActivityStep> = {}): ActivityStep => ({ ...activity.steps.find((item) => item.id === id)!, ...change });
const context = { currentStepId: "s3", cancelled: false, userId: "u1", extraMaterialPending: false, extraMaterialOpen: false, atrExists: false };

it("orders the steps, puts the newest log first, and measures progress", () => {
  expect(activity.steps.map((item) => item.order)).toEqual([1, 2, 3, 4]);
  expect(activity.logs.map((log) => log.id)).toEqual(["l2", "l1"]);
  expect(activity.logs[0]?.user).toBeNull();
  const progress = activityProgress(activity);
  expect([progress.done, progress.total, progress.percent, progress.current?.name, progress.finished]).toEqual([2, 4, 50, "Dispensing", false]);
  expect(activity.steps.map((item) => stepPosition(item, activity.currentStepId))).toEqual(["done", "done", "current", "upcoming"]);
});

it("says how long something took in the largest sensible units", () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 9, 1, 8, minutes)).toISOString();
  expect([duration(at(0), at(0)), duration(at(0), at(40)), duration(at(0), at(135)), duration(at(0), at(120)), duration(at(0), at(60 * 76)), duration(at(0), at(60 * 72))])
    .toEqual(["under a minute", "40 min", "2 h 15 min", "2 h", "3 d 4 h", "3 d"]);
  expect([duration(null, at(5)), duration(at(5), at(0)), duration("nonsense", at(5))]).toEqual([null, null, null]);
  expect(stepDuration(step("s1"))).toBe("30 min");
  expect(stepDuration(step("s4"))).toBeNull();
});

it("lets the responsible person start and finish a critical step, and no one else", () => {
  expect(stepPolicy({ ...context, step: step("s3") })).toMatchObject({ open: true, allowed: true, canStart: true, canComplete: false, blocked: null, waitsFor: null });
  expect(stepPolicy({ ...context, step: step("s3", { status: 1 }) })).toMatchObject({ canStart: false, canComplete: true, canFullReturn: true, canRequestExtraMaterial: true });
  const stranger = stepPolicy({ ...context, userId: "u9", step: step("s3") });
  expect(stranger).toMatchObject({ allowed: false, canStart: false });
  expect(stranger.blocked).toContain("Only the people responsible");
  // A non-critical current step starts itself and is completed by a person.
  expect(stepPolicy({ ...context, currentStepId: "s4", userId: "u9", step: step("s4") })).toMatchObject({ allowed: true, canStart: false, shouldAutoStart: true });
  expect(stepPolicy({ ...context, currentStepId: "s4", userId: "u9", step: step("s4", { status: 1 }) })).toMatchObject({ allowed: true, canComplete: true });
});

it("closes a step that is not current, is finished, or belongs to a cancelled batch", () => {
  expect(stepPolicy({ ...context, step: step("s4") })).toMatchObject({ open: false, shouldAutoStart: false, blocked: "This is not the batch's current step." });
  expect(stepPolicy({ ...context, currentStepId: "s1", step: step("s1") })).toMatchObject({ open: false, blocked: "This step is completed." });
  expect(stepPolicy({ ...context, cancelled: true, step: step("s3") })).toMatchObject({ open: false, canStart: false, blocked: "The batch was cancelled." });
});

it("holds a start while extra material is pending, and a completion while a test request is open", () => {
  expect(stepPolicy({ ...context, extraMaterialPending: true, step: step("s3") }).canStart).toBe(false);
  expect(stepPolicy({ ...context, currentStepId: "s4", extraMaterialPending: true, step: step("s4") })).toMatchObject({ canStart: false, shouldAutoStart: false });
  expect(stepPolicy({ ...context, atrExists: true, step: step("s3", { status: 1 }) }).canComplete).toBe(false);
  // A step carried out through its own record moves with that record, wherever it sits in the procedure.
  expect(stepPolicy({ ...context, currentStepId: "s2", userId: "u2", step: step("s2", { status: 0 }) })).toMatchObject({ canStart: false, canRequestStock: true, waitsFor: 1 });
  expect(stepPolicy({ ...context, currentStepId: "s2", userId: "u2", step: step("s2", { status: 1 }) })).toMatchObject({ canComplete: false });
  const packing = step("s3", { status: 0, team: [{ ...step("s3").team[0]!, action: 4 }] });
  expect(stepPolicy({ ...context, step: packing })).toMatchObject({ canStart: true, waitsFor: 4 });
  expect(stepPolicy({ ...context, step: { ...packing, status: 1 } })).toMatchObject({ canComplete: false, canFinalPack: true });
});

it("holds manual completion for pending approval and approved but unissued extra material", () => {
  const running = step("s3", { status: 1 });
  expect(stepPolicy({ ...context, step: running, extraMaterialPending: true, extraMaterialOpen: true }))
    .toMatchObject({ canManuallyComplete: true, canComplete: false });
  expect(stepPolicy({ ...context, step: running, extraMaterialPending: false, extraMaterialOpen: true }).canComplete).toBe(false);
  expect(stepPolicy({ ...context, step: running, extraMaterialOpen: false }).canComplete).toBe(true);
});

it("raises a test request once, for the stage set on the step's instruction", () => {
  const testing = step("s3", { team: [{ ...step("s3").team[0]!, action: 7, ardStage: 2 }] });
  expect(configuredTestStage(testing)).toBe(2);
  expect(configuredTestStage(step("s3"))).toBeNull();
  expect(stepPolicy({ ...context, step: testing })).toMatchObject({ canRequestAtr: true, canStart: false, waitsFor: 7 });
  // Once the request exists it cannot be raised again; a step it failed to start can be started by hand.
  expect(stepPolicy({ ...context, atrExists: true, step: testing })).toMatchObject({ canRequestAtr: false, canStart: true });
  const record = { id: "bmr-1", status: 1, batchNumber: "WM-001", manufacturingDate: "2026-10-01T00:00:00Z", expiryDate: null };
  expect(atrProblem(null, record)).toContain("no analytical raw data");
  expect(atrProblem(2, null)).toContain("no batch manufacturing record");
  expect(atrProblem(2, record)).toBeNull();
  expect(atrRequest({ stage: 2, record, batchId: "b1", stepId: "s3", stateId: "st", filled: "100 ml" })).toEqual({
    stage: 2, stateId: "st", filled: "100 ml", productionScheduleProductId: "b1", productionActivityStepId: "s3", batchManufacturingRecordId: "bmr-1", manufacturingDate: "2026-10-01T00:00:00Z" });
});

it("reads the board into columns of cards", () => {
  const board = activityBoardSchema.parse([{ operation: { id: "o1", name: "Dispensing" }, activities: [
    { id: "x", batchNumber: "WM-001", quantity: 1_500_000, productionScheduleProduct: raw.productionScheduleProduct, currentStep: { status: 1, isCritical: true, productionActivity: { id: "a1" }, responsibleUsers: [{ user: { id: "u1", firstName: "Ama", lastName: "O" } }] } },
    { batchNumber: "lost" },
  ] }, { operation: { id: "o2", name: "Mixing" } }]);
  expect(board.map((column) => [column.name, column.cards.length])).toEqual([["Dispensing", 1], ["Mixing", 0]]);
  expect(board[0]?.cards[0]).toMatchObject({ activityId: "a1", productName: "Wormee", scheduleCode: "PS-7", unit: "ml", critical: true });
  expect(activityBoardSchema.parse(null)).toEqual([]);
});

it("builds one voucher for all the batch's materials, and names what stops it", () => {
  const material = { id: "m-0", materialId: "m", code: "RM-1", name: "Sugar", unit: "g", unitId: "u-g", needed: 500, onHand: 0, reserved: 0, reservedByAll: 0, elsewhere: 0, source: null };
  expect(requisitionProblem(material)).toBeNull();
  expect(requisitionProblem({ ...material, unitId: null })).toBe("it has no unit of measure in this department");
  expect(requisitionProblem({ ...material, needed: 0 })).toBe("the quantity needed is zero");
  const when = new Date(2026, 9, 3);
  expect(stockRequisitionRequest({ code: "SR-9", expectedDelivery: when, comments: null }, [material], "b1", "s2")).toEqual({
    code: "SR-9", requisitionType: 0, comments: "", expectedDelivery: when.toISOString(), productionScheduleProductId: "b1", productionActivityStepId: "s2",
    items: [{ materialId: "m", quantity: 500, uomId: "u-g" }] });
});

it("asks for extra material in the unit typed, stored in the smallest unit, and never more than is free", () => {
  const sugar = { id: "m-0", materialId: "m", code: "RM-1", name: "Sugar", unit: "g", unitId: "u-g", needed: 500, onHand: 5_000_000, reserved: 0, reservedByAll: 1_000_000, elsewhere: 0, source: null };
  const bottle = { ...sugar, id: "b-0", materialId: "b", name: "Bottle", unit: "piece", unitId: "u-p", onHand: 100, reservedByAll: 0 };
  const lines = extraMaterialLines([sugar], [bottle]);
  expect(lines.map((line) => [line.kind, line.unit, line.quantity])).toEqual([["raw", "kg", null], ["packaging", "piece", null]]);
  expect(relatedUnits("g")).toEqual(["mg", "g", "kg"]);
  expect([toSmallestUnit(2.5, "kg"), toSmallestUnit(3, "L"), toSmallestUnit(7, "piece")]).toEqual([2_500_000, 3000, 7]);
  const asked = [{ ...lines[0]!, quantity: 2.5 }, { ...lines[1]!, quantity: null }];
  expect(asked.map(extraMaterialProblem)).toEqual([null, null]);
  expect(extraMaterialRequest(asked)).toEqual([{ materialId: "m", uoMId: "u-g", quantity: 2_500_000 }]);
  // 4,000,000 mg are free; 5 kg is more than that.
  expect(extraMaterialProblem({ ...lines[0]!, quantity: 5 })).toBe("More than the warehouse has free");
  expect(extraMaterialProblem({ ...lines[0]!, quantity: 0 })).toBe("Enter a quantity above zero, or clear it");
  expect(extraMaterialProblem({ ...lines[1]!, quantity: 101 })).toBe("More than the warehouse has free");
});

it("sends finished goods as yield, entered as shippers and loose packs", () => {
  // 150 bottles per shipper, one bottle per pack: yield and packs are the same number here.
  const bottles = fgLayout({ packPerShipper: 150, basePackingUoM: { name: "Bottle" } });
  const record = { id: "bmr-1", batchNumber: "WM-001", manufacturingDate: null, expiryDate: null, packing: { id: "s1", name: "150 X 20ml", packsPerShipper: 150, unit: { id: "u-b", name: "Bottle" }, layout: bottles } };
  const first = transferTotals(75_300, []);
  expect(first).toEqual({ packed: 75_300, transferred: 0, remaining: 75_300 });
  expect(transferYield(502, 0, first.remaining, bottles)).toBe(75_300);
  expect(transferYield(6, 100, first.remaining, bottles)).toBe(1000);
  const now = new Date(Date.UTC(2026, 9, 1, 8, 5, 9, 123));
  expect(transferNoteNumber(now)).toBe("FGTN-20261001080509123");
  expect(transferRequest({ quantity: 75_300, record, stepId: "s9", totals: first, now })).toEqual({ transferNoteNumber: "FGTN-20261001080509123",
    batchManufacturingRecordId: "bmr-1", productPackingId: "s1", productionActivityStepId: "s9", quantityPerPack: 1, totalQuantity: 75_300, uoMId: "u-b", isPartial: false });
  expect(transferRequest({ quantity: 300, record, stepId: "s9", totals: first })?.isPartial).toBe(true);
  const later = transferTotals(75_300, [{ quantity: 75_000 }]);
  expect(later.remaining).toBe(300);
  // The rest of an earlier partial transfer is still a partial one for the server.
  expect(transferRequest({ quantity: 300, record, stepId: "s9", totals: later })?.isPartial).toBe(true);
  expect(transferProblem({ record, packed: null, remaining: 0 })).toContain("Final packing has not been recorded");
  expect(transferProblem({ record, packed: 10, remaining: 0 })).toBe("Everything packed has already been transferred.");
  expect(transferProblem({ record: { ...record, packing: { ...record.packing, unit: null } }, packed: 10, remaining: 10 })).toContain("no unit of measure");
  expect(transferProblem({ record, packed: 10, remaining: 10 })).toBeNull();
});

it("sends tablets as yield and sends the whole remainder when everything left is entered", () => {
  const tablets = fgLayout({ packPerShipper: 80, basePackingUoM: { name: "Tablet" }, packingLists: [{ uom: { name: "Shipper" }, quantity: 80, order: 1 }, { uom: { name: "Box" }, quantity: 20, order: 2 }, { uom: { name: "Strip" }, quantity: 10, order: 3 }] });
  const record = { id: "bmr-2", batchNumber: "DC-1", manufacturingDate: null, expiryDate: null, packing: { id: "s2", name: "80 X 20 X 10", packsPerShipper: 80, unit: { id: "u-t", name: "Tablet" }, layout: tablets } };
  // 2 shippers, 3 boxes and 7 tablets short of a box.
  const remaining = 2 * 16_000 + 3 * 200 + 7;
  expect(transferYield(1, 5, remaining, tablets)).toBe(17_000);
  expect(transferYield(2, 3, remaining, tablets)).toBe(remaining);
  expect(transferRequest({ quantity: 17_000, record, stepId: "s9", totals: transferTotals(remaining, []) })).toMatchObject({ quantityPerPack: 200, totalQuantity: 17_000, isPartial: true });
  expect(transferProblem({ record: { ...record, packing: { ...record.packing, layout: fgLayout({ packPerShipper: 80, packingLists: [{ uom: { name: "Shipper" }, quantity: 7, order: 1 }] }) } }, packed: 10, remaining: 10 })).toContain("does not say how many units fill a pack");
});

it("works out the yield, the shippers, and when a reason is owed", () => {
  const source = { category: "syrup" as const, receivedUnit: "L", packingExpectedYield: 75_000, packsPerShipper: 150 };
  const figures = yieldFigures({ received: 1500, averageFilled: 20, actualPacked: 75_300, qcSample: 20, retained: 20, stability: 10 }, source);
  expect(figures).toMatchObject({ expected: 75_000, samples: 50, afterSamples: 75_250, gainOrLoss: 300, fullShippers: 501, leftOver: 100, totalPacked: 75_250, needsReason: false });
  expect(figures.percent).toBeCloseTo(0.4, 3);
  expect(yieldFigures({ received: 1500, averageFilled: 20, actualPacked: 73_000, qcSample: 0, retained: 0, stability: 0 }, source)).toMatchObject({ gainOrLoss: -2000, needsReason: true });
  // Tablets: the expected count comes from the bulk received and the average tablet weight (120 kg at 500 mg each).
  expect(yieldFigures({ received: 120, averageFilled: 500, actualPacked: null, qcSample: null, retained: null, stability: null }, { category: "tablet", receivedUnit: "kg", packingExpectedYield: 1, packsPerShipper: 100 }))
    .toMatchObject({ expected: 240_000, percent: null, needsReason: false, totalPacked: 0 });
  expect(packCategory(" Dry Powder ")).toBe("dry powder");
  expect(packCategory("Box")).toBeNull();
  expect(yieldTerms("tablet", "mg")).toMatchObject({ countUnit: "tablets", receivedUnit: "kg", averageUnit: "mg", averageLabel: "Average weight of tablet" });
  expect(yieldTerms("syrup", "ml")).toMatchObject({ countUnit: "bottles", receivedUnit: "L", averageUnit: "ml", receivedLabel: "Total volume received" });
});

it("accounts for each packaging material and returns what is left", () => {
  const materials = packingMaterials([{ materialId: "m1", name: "Bottle", code: "PM-1", unit: "piece", quantity: 76_000 }, { materialId: "m2", name: "Syrup base", code: "RM-9", unit: "g", quantity: 2_000_000 }],
    [{ materialId: "m1", quantity: 500 }, { materialId: "m1", quantity: 100 }, { materialId: null, quantity: 9 }]);
  expect(materials[0]).toMatchObject({ received: 76_000, delivered: 600, total: 76_600, displayUnit: "piece" });
  expect(materials[1]).toMatchObject({ displayUnit: "kg", total: 2_000_000 });
  const bottle = materials[0]!;
  expect(materialFigures(bottle, { packed: 75_300, rejected: 300, sampled: 0, reason: "" })).toMatchObject({ total: 76_600, returned: 1000, needsReason: false, problem: null });
  expect(materialFigures(bottle, { packed: null, rejected: null, sampled: null, reason: "" }).problem).toBe("Enter the quantity packed");
  expect(materialFigures(bottle, { packed: 76_000, rejected: 700, sampled: 0, reason: "" }).problem).toBe("Packed, rejected, and sampled add up to more than was received");
  expect(materialFigures(bottle, { packed: 70_000, rejected: 2000, sampled: 0, reason: "" }).problem).toContain("Give the reason");
  expect(materialFigures(bottle, { packed: 70_000, rejected: 2000, sampled: 0, reason: "Breakage" }).problem).toBeNull();
  const entries = { m1: { packed: 75_300, rejected: 300, sampled: 0, reason: "" }, m2: { packed: 1.5, rejected: 0.5, sampled: null, reason: "Spill" } };
  const requests = materialRequests(materials, entries);
  expect(requests[0]).toMatchObject({ materialId: "m1", totalReceivedQuantity: 76_600, packedQuantity: 75_300, rejectedQuantity: 300, returnedQuantity: 1000, percentageVarianceDescription: "" });
  // Entered in kg, stored in mg; the loss is above the limit, so its reason goes with it.
  expect(requests[1]).toMatchObject({ packedQuantity: 1_500_000, rejectedQuantity: 500_000, returnedQuantity: 0, percentageLoss: 25, percentageVarianceDescription: "Spill" });
  expect(returnedMaterials(materials, entries, { m1: "u-p", m2: "u-g" })).toEqual([{ materialId: "m1", quantity: 1000, uoMId: "u-p" }]);
});
