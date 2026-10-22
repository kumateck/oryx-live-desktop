import { api } from "@/shared/api/base-api";
interface Invitations { emailList: { email: string; employeeType: 0 | 1 }[] }
/** Existing controller returns an empty 200; its response has no generated typed operation. */
export const invitationsApi = api.injectEndpoints({ endpoints: (build) => ({
  inviteEmployees: build.mutation<void, Invitations>({ query: (body) => ({ url: "/api/v1/employee/register", method: "POST", body, headers: { Module: "HR Management", SubModule: "Employee onboarding invitations" } }) }),
}) });
