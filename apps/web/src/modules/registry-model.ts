import { canAccess } from "../shared/auth/access.ts";
import type { AccessRule, AppPath, ModuleManifest } from "./contract.ts";

export { canAccess };

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
    const patterns = new Set<string>();
    for (const route of manifest.routes ?? []) {
      if (patterns.has(route.pattern)) throw new Error(`Duplicate route access in ${manifest.id}: ${route.pattern}`);
      if (route.pattern !== manifest.root && !route.pattern.startsWith(`${manifest.root}/`)) {
        throw new Error(`Route access outside ${manifest.id}: ${route.pattern}`);
      }
      patterns.add(route.pattern);
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
export function routeAccessRule(manifests: readonly ModuleManifest[], pathname: string): AccessRule | null {
  const path = segments(pathname);
  const normalized = `/${path.join("/")}`;
  const owner = manifests
    .filter((manifest) => normalized === manifest.root || normalized.startsWith(`${manifest.root}/`))
    .sort((a, b) => b.root.length - a.root.length)[0];
  if (!owner) return null;
  let best: { score: number; access: AccessRule } | null = null;
  for (const route of owner.routes ?? []) {
    const score = matchScore(route.pattern, path);
    if (score >= 0 && (!best || score > best.score)) best = { score, access: route.access };
  }
  return best?.access ?? owner.access;
}
