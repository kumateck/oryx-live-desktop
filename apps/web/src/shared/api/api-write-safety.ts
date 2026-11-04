import type { ApiStore } from "./api-provider";

/** Read synchronously at close/refresh time, including writes initiated in another tab. */
export const apiWritesPending = (store: ApiStore): boolean => Object.values(store.getState().oryxApi.mutations).some((mutation) => mutation?.status === "pending");
