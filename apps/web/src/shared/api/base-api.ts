import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { refreshTokens } from "../auth/session-api";
import { notifySessionExpired } from "../auth/session-events";
import { tokenStore } from "../auth/token-store";

const request = fetchBaseQuery({
  baseUrl: typeof window === "undefined" ? "/" : `${window.location.origin}/`,
  credentials: "omit",
  prepareHeaders(headers) {
    const token = tokenStore.accessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const api = createApi({
  reducerPath: "oryxApi",
  baseQuery: async (args, context, extraOptions) => {
    let result = await request(args, context, extraOptions);
    if (result.error?.status === 401) {
      // The access token is short-lived: renew it once and repeat the request before giving up.
      const renewed = await refreshTokens().catch(() => false);
      if (renewed) result = await request(args, context, extraOptions);
      if (!renewed || result.error?.status === 401) notifySessionExpired();
    }
    return result;
  },
  tagTypes: ["Role", "RoleList", "UserList", "ProductList", "Product", "ProductPacking", "ProductBom", "ProductPackages", "ProductRoutes", "ProductStp", "StpDocument"],
  endpoints: () => ({}),
});
