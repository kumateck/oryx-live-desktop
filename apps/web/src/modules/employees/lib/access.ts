export const employeePermissions = { active: "CanViewActiveEmployee", inactive: "CanViewInactiveEmployee", new: "CanViewNewEmployee", register: "CanRegisterEmployee", update: "CanUpdateEmployeeInfo", email: "CanUpdateEmployeeEmail", details: "CanViewEmployeeDetails", department: "CanViewDepartmentEmployee", export: "CanExportDepartmentEmployee" } as const;
export const employeeAudit = { module: "HR Management", subModule: "Employee management" } as const;
export enum EmployeeType { Casual = 0, Permanent = 1 }
export enum EmployeeStatus { Active = 0, Inactive = 1, New = 2 }
export enum ActiveStatus { Question = 0, Warning = 1, FinalWarning = 2, Suspension = 3 }
export enum InactiveStatus { Resignation = 0, VacatedPost = 1, Deceased = 2, SummaryDismissed = 3, Termination = 4, Transfer = 5 }
export const employeeTypeLabels = ["Casual", "Permanent"] as const;
export const employeeStatusLabels = ["Active", "Inactive", "New"] as const;
export const activeStatusLabels = ["Question", "Warning", "Final warning", "Suspension"] as const;
export const inactiveStatusLabels = ["Resignation", "Vacated post", "Deceased", "Summary dismissed", "Termination", "Transfer"] as const;
export const employeeDetailsPath = (id: string) => `/hr/employee-management/${encodeURIComponent(id)}/details`;
