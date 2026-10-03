import { useEffect, useState, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Provider } from "react-redux";
import { useCurrentUser } from "../auth/session-provider";
import { api } from "./base-api";

function createApiStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (defaults) => defaults().concat(api.middleware),
  });
}

function ApiStore({ children }: { children: ReactNode }) {
  const [store] = useState(createApiStore);
  // Lets a query ask to be read again when the window comes back into focus or the network returns.
  // Only queries that opt in are affected; notifications do.
  useEffect(() => setupListeners(store.dispatch), [store]);
  return <Provider store={store}>{children}</Provider>;
}

export function ApiProvider({ children }: { children: ReactNode }) {
  // A fresh store per signed-in user prevents cross-account cache reuse, including when
  // another window signs in as someone else and this workspace stays mounted.
  const user = useCurrentUser();
  return <ApiStore key={user?.id ?? "anonymous"}>{children}</ApiStore>;
}
