import { identityApi } from "@/shared/api/generated/identity";

export const roleApi = identityApi.enhanceEndpoints({
  endpoints: {
    getApiV1Role: { providesTags: (roles) => [
      { type: "RoleList" as const, id: "all" },
      ...(roles ?? []).flatMap((role) => role.id ? [{ type: "Role" as const, id: role.id }] : []),
    ] },
    getApiV1RoleById: { providesTags: (_result, _error, arg) => [{ type: "Role", id: arg.id }] },
    getApiV1PermissionRoleByRoleId: { providesTags: (_result, _error, arg) => [{ type: "Role", id: arg.roleId }] },
    postApiV1Role: { invalidatesTags: (_result, error) => error ? [] : [{ type: "RoleList", id: "all" }] },
    putApiV1RoleById: { invalidatesTags: (_result, _error, arg) => [
      { type: "Role", id: arg.id }, { type: "RoleList", id: "all" },
    ] },
    deleteApiV1RoleById: { invalidatesTags: (_result, _error, arg) => [
      { type: "Role", id: arg.id }, { type: "RoleList", id: "all" },
    ] },
    putApiV1PermissionRoleByRoleId: { async onQueryStarted(arg, { dispatch, queryFulfilled }) {
      try {
        await queryFulfilled;
        // Reflect a successful save while the authoritative refetch is in flight.
        const { body, ...queryArg } = arg;
        dispatch(identityApi.util.updateQueryData("getApiV1PermissionRoleByRoleId", queryArg, () => body));
      } catch { /* Failed saves keep the existing assignments and the editor draft. */ }
    }, invalidatesTags: (_result, error, arg) => error ? [] : [
      { type: "Role", id: arg.roleId },
    ] },
  },
});

export const {
  useGetApiV1RoleQuery,
  useGetApiV1RoleByIdQuery,
  useGetApiV1PermissionModulesQuery,
  useGetApiV1PermissionRoleByRoleIdQuery,
  usePostApiV1RoleMutation,
  usePutApiV1RoleByIdMutation,
  usePutApiV1PermissionRoleByRoleIdMutation,
  useDeleteApiV1RoleByIdMutation,
  useLazyGetApiV1RoleCheckByIdQuery,
} = roleApi;
