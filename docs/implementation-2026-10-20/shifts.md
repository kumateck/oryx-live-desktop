# Shift planning and import — 2026-10-21

## Implemented in Live

`/plan-shift`, `/plan-shift/:id/calendar` and `/hr/shift-schedule-upload` now have protected routes. Planning retains paged schedules, department, dates, frequency and all five actual server statuses: New, Assigned, InProgress, Cancelled and Expired. The reference calendar incorrectly labels the first three statuses Draft/Active/Inactive; Live uses the actual enum.

Calendar views cover day, Monday-based week, month and year. Both current backend range/day endpoints ignore their date arguments and return all assignments. Live validates schedule/shift identities, unique groups and employees, then filters the actual assignment dates for the chosen view. It displays each employee's name, staff number, department/designation, shift and category. Target screen and live data acceptance are pending.

Full-period assignment requires the actual POST permission `CanCreateShiftSchedule` (the reference incorrectly shows the action with edit permission), with schedule, employee-detail, category and policy read access. Replacement uses `CanEditShiftSchedule`. Dialogs freeze schedule/calendar evidence and reread schedule, exact assignment, category, employee availability and active exact-department membership before writing. Permission and account identity are rechecked immediately before the mutation. Historical dates and cancelled/expired schedules are refused.

The server assigns every calendar day of a schedule, ignoring the shift type's applicable-days list. This scope is explicit in the dialog. Live checks the whole proposed daily batch against the effective daily/weekly hours and rest constraints, including accumulation across a week, rather than copying the server's one-new-shift-at-a-time policy loophole. No statutory defaults are invented. Schedules over 366 days are refused for reconciliation. The server still owns global conflicts and policy checks; client checks cannot provide server concurrency guarantees.

After assignment/replacement, Live rereads the actual calendar and verifies every selected employee/date or the exact replacement while preserving other assignments. A missing employee/date is reported as an accepted but incomplete result, not success. A sent command cannot be replayed from the open dialog, including after a refused or lost response. The user must close and inspect current state before another action.

## Workbook import

The first worksheet requires unique literal STAFF ID, CATEGORY and SHIFT TYPE headers/values. Preview preserves original leading zeros and all workbook columns. XLSX is bounded to 5 MB, 10,000 rows and 30 columns, and reuses the central OOXML worker/container validation. Legacy XLS must be converted. Duplicate staff rows are refused because the server silently keeps only one assignment per employee/date regardless of category/type.

The schedule determines the department; an unrelated department cannot be submitted. Confirmation freezes the original file and preview. Fresh preflight verifies the complete category register, unique exact-department active staff, shift names belonging to this schedule, effective policy and all existing schedule assignments. Existing employees in the schedule are refused rather than silently skipping duplicates. Multipart upload uses the actual `file`, `departmentId` and `shiftId` contract, HR/Shift Schedule Upload audit headers and success-only invalidation.

The backend repository builds an import summary with skipped rows, but its controller discards it and returns 204. Live therefore rereads and reconciles every expected employee/date after import. A skipped or unverifiable result is explicit and cannot be replayed from the same dialog. Backend notification and audit behavior are preserved; no real import was executed during testing.

## Remaining server gaps / omitted unsafe operation

`PUT /shift-schedules/:id/update-schedule` is not used: the server removes requested employees from the entire schedule while claiming a selected date, and creates added rows without ScheduleDate or ShiftTypeId. The reference's calendar does not use that endpoint. Its repair requires backend work; copying it would corrupt schedule data.

The available-employee endpoint does not filter employee active status; Live rechecks details. It conservatively excludes staff with any scheduled period on the selected date, even for a non-overlapping shift. This may exclude otherwise eligible replacements; the backend contract needs improvement before widening it in Live. Department employee reads currently allow anonymous access on the backend; Live requires department employee access for import, but that does not repair server authorization.

Personal performance ownership, public onboarding and general stores/services remain separate unfinished work. This document does not claim complete HR or five-domain parity.

## Verification

Focused shift rules, command mocks, workbook fixtures and route tests pass: 314 checks across five files (including route coverage). They cover date filtering, leap-month/Monday-week ranges, actual enum zero, duplicate identities, incomplete batches, replacements, weekly policy accumulation, stale/unavailable employee checks, 409 without replay, literal leading zeros, formulas, duplicate staff and legacy XLS refusal. Web TypeScript, the production build and full suite passed after correcting the generated EmployeeDto department mapping: 1,254 web tests, 54 Node checks and 9 gateway tests. No real HR record or notification was created. Installed-app visual acceptance remains pending.

Documentation updated: this file, implementation README/scope.csv, services.md and workflows.md.
