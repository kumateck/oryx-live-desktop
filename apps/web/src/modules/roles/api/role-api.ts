import { identityApi } from "@/shared/api/generated/identity";
import { addTags } from "@/shared/api/add-tags";

export const roleApi = identityApi.enhanceEndpoints({
  endpoints: {
    getApiV1Role: (definition) => { definition.providesTags = addTags(definition.providesTags, (roles) => [
      { type: "RoleList" as const, id: "all" },
      ...(roles ?? []).flatMap((role) => role.id ? [{ type: "Role" as const, id: role.id }] : []),
    ]); },
    getApiV1RoleById: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Role", id: arg.id }]); },
    getApiV1PermissionRoleByRoleId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Role", id: arg.roleId }]); },
    postApiV1Role: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "RoleList", id: "all" }]); },
    putApiV1RoleById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, _error, arg) => [
      { type: "Role", id: arg.id }, { type: "RoleList", id: "all" },
    ]); },
    deleteApiV1RoleById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, _error, arg) => [
      { type: "Role", id: arg.id }, { type: "RoleList", id: "all" },
    ]); },
    putApiV1PermissionRoleByRoleId: (definition) => {
      definition.onQueryStarted = async (arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          // Reflect a successful save while the authoritative refetch is in flight.
          const { body, ...queryArg } = arg;
          dispatch(identityApi.util.updateQueryData("getApiV1PermissionRoleByRoleId", queryArg, () => body));
        } catch { /* Failed saves keep the existing assignments and the editor draft. */ }
      };
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [{ type: "Role", id: arg.roleId }]);
    },
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
