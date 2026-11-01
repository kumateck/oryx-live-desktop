import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1AuthLogin: build.mutation<
      PostApiV1AuthLoginApiResponse,
      PostApiV1AuthLoginApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/login", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/login`,
        method: "POST",
        body: queryArg.microsoftAspNetCoreIdentityDataLoginRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthLoginWithRefreshToken: build.mutation<
      PostApiV1AuthLoginWithRefreshTokenApiResponse,
      PostApiV1AuthLoginWithRefreshTokenApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/login-with-refresh-token", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/login-with-refresh-token`,
        method: "POST",
        body: queryArg.domainEntitiesAuthLoginWithRefreshToken,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthSetPassword: build.mutation<
      PostApiV1AuthSetPasswordApiResponse,
      PostApiV1AuthSetPasswordApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/set-password", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/set-password`,
        method: "POST",
        body: queryArg.domainEntitiesAuthSetPasswordRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthChangePassword: build.mutation<
      PostApiV1AuthChangePasswordApiResponse,
      PostApiV1AuthChangePasswordApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/change-password", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/change-password`,
        method: "POST",
        body: queryArg.domainEntitiesAuthChangePasswordRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthForgotPassword: build.mutation<
      PostApiV1AuthForgotPasswordApiResponse,
      PostApiV1AuthForgotPasswordApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/forgot-password", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/forgot-password`,
        method: "POST",
        body: queryArg.domainEntitiesAuthForgotPasswordRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthUserResetPassword: build.mutation<
      PostApiV1AuthUserResetPasswordApiResponse,
      PostApiV1AuthUserResetPasswordApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/user-reset-password", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/user-reset-password`,
        method: "POST",
        body: queryArg.domainEntitiesAuthUserPasswordChangeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1AuthAdminUserPassword: build.mutation<
      PostApiV1AuthAdminUserPasswordApiResponse,
      PostApiV1AuthAdminUserPasswordApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "auth/admin", id: "LIST" }, { type: "auth", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/auth/admin/user-password`,
        method: "POST",
        body: queryArg.domainEntitiesAuthAdminResetUserPasswordRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Verification: build.mutation<
      PostApiV1VerificationApiResponse,
      PostApiV1VerificationApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "verification", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/verification`,
        method: "POST",
        body: queryArg.sharedRequestsVerifyRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as authApi };
export type PostApiV1AuthLoginApiResponse =
  /** status 200 OK */ DomainEntitiesAuthLoginResponse;
export type PostApiV1AuthLoginApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  microsoftAspNetCoreIdentityDataLoginRequest: MicrosoftAspNetCoreIdentityDataLoginRequest;
};
export type PostApiV1AuthLoginWithRefreshTokenApiResponse =
  /** status 200 OK */ DomainEntitiesAuthLoginResponse;
export type PostApiV1AuthLoginWithRefreshTokenApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthLoginWithRefreshToken: DomainEntitiesAuthLoginWithRefreshToken;
};
export type PostApiV1AuthSetPasswordApiResponse =
  /** status 200 OK */ DomainEntitiesAuthPasswordChangeResponse;
export type PostApiV1AuthSetPasswordApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthSetPasswordRequest: DomainEntitiesAuthSetPasswordRequest;
};
export type PostApiV1AuthChangePasswordApiResponse =
  /** status 200 OK */ DomainEntitiesAuthPasswordChangeResponse;
export type PostApiV1AuthChangePasswordApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthChangePasswordRequest: DomainEntitiesAuthChangePasswordRequest;
};
export type PostApiV1AuthForgotPasswordApiResponse = void;
export type PostApiV1AuthForgotPasswordApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthForgotPasswordRequest: DomainEntitiesAuthForgotPasswordRequest;
};
export type PostApiV1AuthUserResetPasswordApiResponse =
  /** status 200 OK */ DomainEntitiesAuthPasswordChangeResponse;
export type PostApiV1AuthUserResetPasswordApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthUserPasswordChangeRequest: DomainEntitiesAuthUserPasswordChangeRequest;
};
export type PostApiV1AuthAdminUserPasswordApiResponse = void;
export type PostApiV1AuthAdminUserPasswordApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAuthAdminResetUserPasswordRequest: DomainEntitiesAuthAdminResetUserPasswordRequest;
};
export type PostApiV1VerificationApiResponse = void;
export type PostApiV1VerificationApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  sharedRequestsVerifyRequest: SharedRequestsVerifyRequest;
};
export type DomainEntitiesAuthLoginResponse = {
  userId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresIn?: number;
  avatar?: string | null;
};
export type MicrosoftAspNetCoreIdentityDataLoginRequest = {
  email: string | null;
  password: string | null;
  twoFactorCode?: string | null;
  twoFactorRecoveryCode?: string | null;
};
export type DomainEntitiesAuthLoginWithRefreshToken = {
  clientId: string;
  refreshToken: string;
};
export type DomainEntitiesAuthPasswordChangeResponse = {
  success?: boolean;
  errors?: string[] | null;
};
export type DomainEntitiesAuthSetPasswordRequest = {
  password: string;
  confirmPassword: string;
  token: string;
};
export type DomainEntitiesAuthChangePasswordRequest = {
  newPassword?: string | null;
};
export type DomainEntitiesAuthForgotPasswordRequest = {
  clientId?: string | null;
  email?: string | null;
};
export type DomainEntitiesAuthUserPasswordChangeRequest = {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmNewPassword?: string | null;
};
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesAuthAdminResetUserPasswordRequest = {
  userId: string;
  newPassword: string;
};
export type SharedRequestsVerifiableEntity = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type SharedRequestsVerifyRequest = {
  modelType?: SharedRequestsVerifiableEntity;
  modelId?: string;
};
export const {
  usePostApiV1AuthLoginMutation,
  usePostApiV1AuthLoginWithRefreshTokenMutation,
  usePostApiV1AuthSetPasswordMutation,
  usePostApiV1AuthChangePasswordMutation,
  usePostApiV1AuthForgotPasswordMutation,
  usePostApiV1AuthUserResetPasswordMutation,
  usePostApiV1AuthAdminUserPasswordMutation,
  usePostApiV1VerificationMutation,
} = injectedRtkApi;
