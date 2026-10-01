import { InputTypes } from "@/shared/forms/input-types";
import { latestScheduleDate } from "./schedule-dates";

/** The dates and remarks every schedule form has. `earliest` is the first day either date may be. */
export function scheduleHeaderFields(earliest: Date) {
  const limits = { minDate: earliest, maxDate: latestScheduleDate() };
  return [
    { type: InputTypes.DATE, name: "scheduledStartTime", label: "Start date", required: true, ...limits },
    { type: InputTypes.DATE, name: "scheduledEndTime", label: "End date", required: true, ...limits },
    { type: InputTypes.RICHTEXT, name: "remarks", label: "Remarks", rows: 4, placeholder: "Anything the production team should know", className: "md:col-span-2" },
  ] as const;
}
