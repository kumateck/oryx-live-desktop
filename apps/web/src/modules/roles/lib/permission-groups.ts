import type { PermissionModule } from "../schemas/permission-schema";

export type PermissionItem = PermissionModule["children"][number];

/** Catalog actions are authoritative; new catalog defaults never grant a role access. */
export function mergePermissionCatalog(catalog: readonly PermissionModule[], assigned: readonly PermissionModule[]): PermissionModule[] {
  const roles = new Map(assigned.map((module) => [module.module, new Map(module.children.map((child) => [child.key, child.types]))]));
  return catalog.map((module) => {
    const children = module.children.map((child) => ({ ...child,
      types: roles.get(module.module)?.get(child.key)?.includes("Access") ? ["Access"] : [],
    }));
    return { ...module, children, isActive: children.some((child) => child.types.length > 0) };
  });
}

export function groupPermissions(children: readonly PermissionItem[]): Map<string, PermissionItem[]> {
  const groups = new Map<string, PermissionItem[]>();
  for (const child of children) {
    const name = child.subModule?.trim() || "General";
    const group = groups.get(name) ?? [];
    group.push(child);
    groups.set(name, group);
  }
  return groups;
}

export function matchPermissions(children: readonly PermissionItem[], search: string): PermissionItem[] {
  const query = search.trim().toLowerCase();
  return children.filter((child) => `${child.name ?? ""} ${child.key} ${child.description ?? ""} ${child.subModule ?? ""}`.toLowerCase().includes(query));
}

/** Filtered bulk actions affect only the specified module and visible keys. */
export function setPermissionAccess(modules: readonly PermissionModule[], name: string, keys: ReadonlySet<string>, enabled: boolean): PermissionModule[] {
  return modules.map((module) => {
    if (module.module !== name) return module;
    const children = module.children.map((child) => keys.has(child.key) ? { ...child, types: enabled ? ["Access"] : [] } : child);
    return { ...module, children, isActive: children.some((child) => child.types.length > 0) };
  });
}

export function accessCount(children: readonly PermissionItem[]): number {
  return children.filter((child) => child.types.includes("Access")).length;
}

/** Grants or removes the given permissions wherever they are. Untouched modules and permissions keep their identity. */
export function setAccessForKeys(modules: readonly PermissionModule[], keys: ReadonlySet<string>, enabled: boolean): PermissionModule[] {
  return modules.map((module) => {
    let touched = false;
    const children = module.children.map((child) => {
      if (!keys.has(child.key) || child.types.includes("Access") === enabled) return child;
      touched = true;
      return { ...child, types: enabled ? ["Access"] : [] };
    });
    return touched ? { ...module, children, isActive: children.some((child) => child.types.length > 0) } : module;
  });
}

export interface PermissionRow { item: PermissionItem; module: string }
/** Every permission matching a search, in any module, each with the module it belongs to. */
export function searchPermissions(modules: readonly PermissionModule[], search: string): PermissionRow[] {
  return modules.flatMap((module) => matchPermissions(module.children, search).map((item) => ({ item, module: module.module })));
}
