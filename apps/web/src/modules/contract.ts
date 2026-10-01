import type { AccessRule } from "../shared/auth/access.ts";

export type { AccessContext, AccessRule } from "../shared/auth/access.ts";
export type AppPath = `/${string}`;

/** Access for one route. `:name` matches a single path segment, as in the router. */
export interface RouteAccess<Root extends AppPath> {
  readonly pattern: Root | `${Root}/${string}`;
  readonly access: AccessRule;
}

export interface ModuleManifest<Id extends string = string, Root extends AppPath = AppPath> {
  readonly id: Id;
  readonly label: string;
  readonly root: Root;
  readonly order: number;
  /** Required to open any route under `root` that has no more specific entry in `routes`. */
  readonly access: AccessRule;
  readonly routes?: readonly RouteAccess<Root>[];
}
