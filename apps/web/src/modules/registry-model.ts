import { canAccess } from "../shared/auth/access.ts";
import type { AccessContext, AccessRule, AppPath, ModuleManifest, QueryAccess } from "./contract.ts";

export { canAccess };

function validateQueryAccess(query: QueryAccess | undefined, owner: string) {
  if (!query) return;
  const values = query.choices.map((choice) => choice.value);
  if (!query.key.trim() || !values.length || new Set(values).size !== values.length) {
    throw new Error(`Invalid query access in ${owner}`);
  }
}

export function validateModuleRegistry(manifests: readonly ModuleManifest[]): readonly ModuleManifest[] {
  const ids = new Set<string>();
  const roots = new Set<AppPath>();
  for (const manifest of manifests) {
    if (!/^[a-z][a-z0-9-]*$/.test(manifest.id)) throw new Error(`Invalid module ID: ${manifest.id}`);
    if (ids.has(manifest.id)) throw new Error(`Duplicate module ID: ${manifest.id}`);
    if (roots.has(manifest.root)) throw new Error(`Duplicate module root: ${manifest.root}`);
    if (!Number.isInteger(manifest.order)) throw new Error(`Invalid module order: ${manifest.id}`);
    ids.add(manifest.id);
    roots.add(manifest.root);
    validateQueryAccess(manifest.query, manifest.id);
    const patterns = new Set<string>();
    for (const route of manifest.routes ?? []) {
      if (patterns.has(route.pattern)) throw new Error(`Duplicate route access in ${manifest.id}: ${route.pattern}`);
      if (route.pattern !== manifest.root && !route.pattern.startsWith(`${manifest.root}/`)) {
        throw new Error(`Route access outside ${manifest.id}: ${route.pattern}`);
      }
      patterns.add(route.pattern);
      validateQueryAccess(route.query, `${manifest.id}: ${route.pattern}`);
    }
  }
  return [...manifests].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** Number of literal segments when the pattern matches the path, or -1 when it does not. */
function matchScore(pattern: string, path: readonly string[]): number {
  const parts = segments(pattern);
  if (parts.length !== path.length) return -1;
  let literal = 0;
  for (const [index, part] of parts.entries()) {
    if (part.startsWith(":")) continue;
    if (part !== path[index]) return -1;
    literal += 1;
  }
  return literal;
}

/**
 * The rule a user must satisfy to open `pathname`, or null when no module owns it.
 * The most specific matching route wins, so `/roles/create` is not treated as `/roles/:id`.
 */
export function routeAccessPolicy(manifests: readonly ModuleManifest[], pathname: string): { access: AccessRule; query?: QueryAccess } | null {
  const path = segments(pathname);
  const normalized = `/${path.join("/")}`;
  const owner = manifests
    .filter((manifest) => normalized === manifest.root || normalized.startsWith(`${manifest.root}/`))
    .sort((a, b) => b.root.length - a.root.length)[0];
  if (!owner) return null;
  let best: { score: number; access: AccessRule; query?: QueryAccess } | null = null;
  for (const route of owner.routes ?? []) {
    const score = matchScore(route.pattern, path);
    if (score >= 0 && (!best || score > best.score)) best = { score, ...route };
  }
  if (best) return best;
  // A personal landing page cannot silently make every future child route public to signed-in users.
  if (owner.access.kind === "authenticated" && normalized !== owner.root) return null;
  return { access: owner.access, ...(normalized === owner.root && owner.query ? { query: owner.query } : {}) };
}

export function routeAccessRule(manifests: readonly ModuleManifest[], pathname: string): AccessRule | null {
  return routeAccessPolicy(manifests, pathname)?.access ?? null;
}

export type QueryAccessDecision = { state: "allowed" } | { state: "denied" } | { state: "redirect"; search: string };

/** Never mount a forbidden tab. Redirect to the first permitted choice and preserve other filters. */
export function resolveQueryAccess(query: QueryAccess, search: string, context: AccessContext): QueryAccessDecision {
  const params = new URLSearchParams(search);
  const selected = params.get(query.key) ?? query.choices[0]?.value;
  const requested = query.choices.find((choice) => choice.value === selected);
  if (requested && canAccess(requested.access, context)) return { state: "allowed" };
  const first = query.choices.find((choice) => canAccess(choice.access, context));
  if (!first) return { state: "denied" };
  params.set(query.key, first.value);
  params.delete("page");
  return { state: "redirect", search: `?${params.toString()}` };
}
