import { hrApi } from "@/shared/api/generated/hr";
import { identityApi } from "@/shared/api/generated/identity";

const list = { type: "UserList" as const, id: "all" };

export const userApi = identityApi.enhanceEndpoints({
  endpoints: {
    getApiV1User: { providesTags: [list] },
    putApiV1UserRoleById: { invalidatesTags: (_result, error) => error ? [] : [list] },
    putApiV1UserToggleDisableById: { invalidatesTags: (_result, error) => error ? [] : [list] },
  },
});

// Creating a user account for an employee is an HR endpoint; it changes the user list.
export const employeeUserApi = hrApi.enhanceEndpoints({
  endpoints: {
    postApiV1EmployeeUser: { invalidatesTags: (_result, error) => error ? [] : [list] },
  },
});

export const {
  useGetApiV1UserQuery,
  useGetApiV1RoleQuery,
  usePutApiV1UserRoleByIdMutation,
  usePutApiV1UserToggleDisableByIdMutation,
} = userApi;

export const { usePostApiV1EmployeeUserMutation, useLazyGetApiV1EmployeeQuery } = employeeUserApi;
