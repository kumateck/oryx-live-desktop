import type { AccessRule } from "../shared/auth/access.ts";

export type { AccessContext, AccessRule } from "../shared/auth/access.ts";
export type AppPath = `/${string}`;

/** Ordered choices for a query-selected page, such as foreign/local `?type=` lists. */
export interface QueryAccess {
  readonly key: string;
  readonly choices: readonly { readonly value: string; readonly access: AccessRule }[];
}

/** Access for one route. `:name` matches a single path segment, as in the router. */
export interface RouteAccess<Root extends AppPath> {
  readonly pattern: Root | `${Root}/${string}`;
  readonly access: AccessRule;
  readonly query?: QueryAccess;
}

export interface ModuleManifest<Id extends string = string, Root extends AppPath = AppPath> {
  readonly id: Id;
  readonly label: string;
  readonly root: Root;
  readonly order: number;
  /** Required to open any route under `root` that has no more specific entry in `routes`. */
  readonly access: AccessRule;
  /** Applied only to the root page; detail pages resolve record-specific access separately. */
  readonly query?: QueryAccess;
  readonly routes?: readonly RouteAccess<Root>[];
}
