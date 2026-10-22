import { useEffect, useState, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Provider } from "react-redux";
import { useCurrentUser } from "../auth/session-provider";
import { api } from "./base-api";
import { cacheEffectsMiddleware } from "./cache-effects";

function createApiStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (defaults) => defaults().concat(api.middleware, cacheEffectsMiddleware.middleware),
  });
}

export type ApiDispatch = ReturnType<typeof createApiStore>["dispatch"];

function ApiStore({ children }: { children: ReactNode }) {
  const [store] = useState(createApiStore);
  // Reads queries again when the window comes back into focus or the network returns (see base-api.ts).
  useEffect(() => setupListeners(store.dispatch), [store]);
  return <Provider store={store}>{children}</Provider>;
}

export function ApiProvider({ children }: { children: ReactNode }) {
  // A fresh store per signed-in user prevents cross-account cache reuse, including when
  // another window signs in as someone else and this workspace stays mounted.
  const user = useCurrentUser();
  return <ApiStore key={user?.id ?? "anonymous"}>{children}</ApiStore>;
}
