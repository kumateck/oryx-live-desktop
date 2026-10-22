// @vitest-environment jsdom
import { cleanup,render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach,expect,it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession,forgetSession,stubBackend } from "@/test/backend";
import { useShiftCommand } from "./hooks/use-shift-command";
import { scheduleSchema,type Assignment } from "@/shared/shifts/contracts";
const id="01a152ee-6948-7e40-a0f0-8c01e2a43ea9";const employeeId="79e15fc7-4f91-45e3-abbb-330d35956510";
const schedule=scheduleSchema.parse({ id,scheduleName:"Tomorrow",startDate:"2099-01-05T00:00:00Z",endDate:"2099-01-06T00:00:00Z",frequency:0,departmentId:id,scheduleStatus:0,shiftType:[{ id,shiftName:"Day",startTime:"08:00:00",endTime:"16:00:00" }] });
const assignment:Assignment={ employees:[{ employeeId,firstName:"Staff" }],scheduleDate:schedule.startDate,shiftCategory:{ id,name:"A" },shiftType:{ shiftTypeId:id,shiftName:"Day" },shiftSchedule:{ scheduleId:id,startDate:schedule.startDate,endDate:schedule.endDate } };
function Probe() {
 const command=useShiftCommand(schedule,"assign",null,() => {});
 return <><button disabled={!command.allowed || command.busy} onClick={() => void command.run({ shiftScheduleId:id,shiftCategoryId:id,shiftTypeId:id,employeeIds:[employeeId] })}>Assign</button>{command.error ? <p role="alert">{command.error}</p> : null}</>;
}
function open() {
 const backend=stubBackend({ permissions:["CanViewShiftSchedule","CanCreateShiftSchedule","CanViewEmployeeDetails","CanViewShiftCategories","CanViewWorkingHoursPolicy"] });const auth=backend.fetcher.getMockImplementation();
 const state={ schedule:structuredClone(schedule),available:true,partial:false,writeStatus:200 };const writes:string[]=[];
 backend.fetcher.mockImplementation(async (input,init) => {
  if (!(input instanceof Request)) return auth ? auth(input,init) : new Response(null,{ status:500 });
  const url=new URL(input.url);const path=url.pathname;
  if (input.method === "POST") { writes.push(path);return new Response(null,{ status:state.writeStatus }); }
  if (path.endsWith("/working-hours-policy")) return Response.json([]);
  if (path.endsWith("/available")) return Response.json(state.available ? [{ employeeId,firstName:"Staff" }] : []);
  if (path.endsWith("/view")) return Response.json(!writes.length ? [] : state.partial ? [assignment] : [assignment,{ ...assignment,scheduleDate:schedule.endDate }]);
  if (path.includes("/employee/")) return Response.json({ id:employeeId,status:0,department:{ id } });
  if (path.includes("/shift-category/")) return Response.json({ id,name:"A" });
  if (path.endsWith(id)) return Response.json(state.schedule);
  return new Response(null,{ status:404 });
 });rememberSession();render(<SessionProvider><ApiProvider><Probe /></ApiProvider></SessionProvider>);return { state,writes };
}
afterEach(() => { cleanup();forgetSession(); });
const assign=async () => { await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));await userEvent.setup().click(screen.getByRole("button")); };
it("writes only after current schedule, category, employee and availability checks",async () => { const page=open();await assign();await waitFor(() => expect(page.writes).toHaveLength(1));await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));expect(screen.queryByRole("alert")).toBeNull(); });
it.each(["stale","unavailable","partial","refused"] as const)("handles %s without silent success or write replay",async (kind) => {
 const page=open();if (kind === "stale") page.state.schedule={ ...schedule,scheduleName:"Changed" };if (kind === "unavailable") page.state.available=false;if (kind === "partial") page.state.partial=true;if (kind === "refused") page.state.writeStatus=409;
 await assign();await screen.findByRole("alert");expect(page.writes).toHaveLength(kind === "stale" || kind === "unavailable" ? 0 : 1);
 if (kind === "partial" || kind === "refused") { await assign();expect(page.writes).toHaveLength(1); }
});
