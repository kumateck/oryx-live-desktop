import { expect,it } from "vitest";
import { cycle,goal } from "@/shared/performance/test-fixtures";
import { CycleStatus } from "@/shared/performance/contracts";
import { goalProblem } from "./lib/rules";
import { goalEditorSchema } from "./schemas/editor";
const body={ employeeId:goal.employeeId,cycleId:goal.cycleId,title:goal.title,description:goal.description ?? "",weight:goal.weight,targetDate:goal.targetDate };
it("accepts complete scoped goals and refuses overweight, cross-scope and stale records",() => {
 expect(goalProblem(body,cycle,[goal],goal)).toBeNull();
 expect(goalProblem({ ...body,title:"New goal",weight:1 },cycle,[goal])).toMatch(/100%/);
 expect(goalProblem(body,cycle,[{ ...goal,employeeId:cycle.id }],goal)).toMatch(/another employee/);
 expect(goalProblem(body,cycle,[{ ...goal,title:"Changed" }],goal)).toMatch(/changed/);
});
it("refuses closed cycles, dates outside the cycle and duplicate titles",() => {
 expect(goalProblem(body,{ ...cycle,status:CycleStatus.Closed },[])).toMatch(/Closed/);
 expect(goalProblem({ ...body,targetDate:"2027-01-01T00:00:00Z" },cycle,[])).toMatch(/within/);
 expect(goalProblem(body,cycle,[goal])).toMatch(/already/);
});
it("retains zero progress and enforces status/progress consistency and integer weights",() => {
 const value={ employee:{ value:goal.employeeId,label:"Employee" },cycle:{ value:cycle.id,label:cycle.name },title:goal.title,description:"",weight:100,targetDate:new Date(goal.targetDate),status:{ value:"0",label:"Not started" },progressPercentage:0,managerComments:"" };
 expect(goalEditorSchema.parse(value).progressPercentage).toBe(0);
 expect(goalEditorSchema.safeParse({ ...value,status:{ value:"2",label:"Completed" } }).success).toBe(false);
 expect(goalEditorSchema.safeParse({ ...value,weight:1.5 }).success).toBe(false);
});
