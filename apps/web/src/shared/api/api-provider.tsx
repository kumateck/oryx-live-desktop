import { useState, type ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
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
  return <Provider store={store}>{children}</Provider>;
}

export function ApiProvider({ children }: { children: ReactNode }) {
  // A fresh store per signed-in user prevents cross-account cache reuse, including when
  // another window signs in as someone else and this workspace stays mounted.
  const user = useCurrentUser();
  return <ApiStore key={user?.id ?? "anonymous"}>{children}</ApiStore>;
}
