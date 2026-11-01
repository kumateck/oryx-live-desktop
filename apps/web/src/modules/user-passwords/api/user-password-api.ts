import { authApi } from "@/shared/api/generated/auth";
import { identityApi } from "@/shared/api/generated/identity";

// Setting a password changes nothing any list shows, so no cache tags are added.
export const { usePostApiV1AuthAdminUserPasswordMutation } = authApi;
export const { useLazyGetApiV1UserQuery } = identityApi;
