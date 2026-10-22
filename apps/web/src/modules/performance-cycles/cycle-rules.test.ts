import { expect,it } from "vitest";
import { cycle } from "@/shared/performance/test-fixtures";
import { CycleStatus } from "@/shared/performance/contracts";
import { cycleCreateProblem,cycleTransitionProblem } from "./lib/rules";
it("allows draft activation and active closure, but refuses reopening and changed evidence",() => {
 const draft={ ...cycle,status:CycleStatus.Draft };
 expect(cycleTransitionProblem(draft,draft,CycleStatus.Active)).toBeNull();
 expect(cycleTransitionProblem(cycle,cycle,CycleStatus.Closed)).toBeNull();
 expect(cycleTransitionProblem(cycle,cycle,CycleStatus.Draft)).toBeTruthy();
 expect(cycleTransitionProblem(cycle,{ ...cycle,goalCount:2 },CycleStatus.Closed)).toMatch(/changed/);
});
it("refuses invalid periods and duplicate cycles while retaining numeric annual type zero",() => {
 const body={ name:cycle.name,type:cycle.type,periodStart:cycle.periodStart,periodEnd:cycle.periodEnd };
 expect(cycleCreateProblem(body,[])).toBeNull();expect(body.type).toBe(0);
 expect(cycleCreateProblem(body,[cycle])).toMatch(/already exists/);
 expect(cycleCreateProblem({ ...body,periodEnd:body.periodStart },[])).toMatch(/end date/);
});
