import { api } from "@/shared/api/base-api";
import { hrApi } from "@/shared/api/generated/hr";
import type { AssignBody, SwapBody } from "../schemas/contracts";
export { hrApi };
const headers = { Module: "HR Management", SubModule: "Shift Planning" };
export const shiftCommandApi = api.injectEndpoints({
  endpoints: (build) => ({
    assignPlannedShift: build.mutation<void, AssignBody>({
      query: (body) => ({ url: "/api/v1/shift-schedules/assign", method: "POST", body, headers }),
      invalidatesTags: (_r, error, arg) =>
        error
          ? []
          : [
              { type: "shift-schedule", id: arg.shiftScheduleId },
              { type: "shift-schedule", id: "LIST" },
              { type: "employee", id: arg.shiftScheduleId },
            ],
    }),
    swapPlannedShift: build.mutation<void, SwapBody>({
      query: (body) => ({ url: "/api/v1/shift-schedules/swap", method: "POST", body, headers }),
      invalidatesTags: (_r, error, arg) =>
        error
          ? []
          : [
              { type: "shift-schedule", id: arg.shiftScheduleId },
              { type: "employee", id: arg.shiftScheduleId },
            ],
    }),
  }),
});
