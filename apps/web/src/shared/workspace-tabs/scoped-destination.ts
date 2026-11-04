import { modules } from "@/modules/registry";
import { routeAccessPolicy } from "@/modules/registry-model";
import type { PermissionRequirement } from "../auth/access";
import { destinationKey, type TabLocation } from "./destinations";

/** An omitted permission choice means the manifest's first allowed choice, not a separate page. */
export function scopedDestinationKey(location: TabLocation, allows: (requirement: PermissionRequirement) => boolean): string {
  const policy = routeAccessPolicy(modules, location.pathname);
  const params = new URLSearchParams(location.search);
  const query = policy?.query;
  if (query && !params.has(query.key)) {
    const choice = query.choices.find((candidate) => allows(candidate.access));
    if (choice) params.set(query.key, choice.value);
  }
  return destinationKey({ ...location, search: params.toString() });
}
