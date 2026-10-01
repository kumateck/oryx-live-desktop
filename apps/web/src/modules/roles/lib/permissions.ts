import type { PermissionModule } from "../schemas/permission-schema";

export const rolePermissions = {
  view: "CanViewRoles",
  create: "CanCreateRole",
  edit: "CanEditRole",
  delete: "CanDeleteRole",
  updatePermissions: "CanUpdateExistingPermission",
} as const;

/** Same address as Oryx Next, so links and bookmarks carry over. */
export const rolesPath = "/access-management/roles";

export const audit = { module: "Access Management", subModule: "Manage Roles" } as const;

export function toggleAccess(
  modules: readonly PermissionModule[], key: string,
): PermissionModule[] {
  return modules.map((module) => {
    const children = module.children.map((child) => {
      if (child.key !== key) return child;
      const enabled = child.types?.includes("Access") ?? false;
      return { ...child, types: enabled ? [] : ["Access"] };
    });
    return { ...module, children, isActive: children.some((child) => child.types.length > 0) };
  });
}

export function clearAccess(modules: readonly PermissionModule[]): PermissionModule[] {
  return modules.map((module) => ({ ...module, isActive: false,
    children: module.children.map((child) => ({ ...child, types: [] })),
  }));
}

export function applyAccessOverrides(modules: readonly PermissionModule[], overrides: Readonly<Record<string, boolean>>): PermissionModule[] {
  return modules.map((module) => {
    const children = module.children.map((child) => ({ ...child,
      types: child.key in overrides ? overrides[child.key] ? ["Access"] : [] : child.types,
    }));
    return { ...module, children, isActive: children.some((child) => child.types.length > 0) };
  });
}

export function accessOverrides(base: readonly PermissionModule[], changed: readonly PermissionModule[]): Record<string, boolean> {
  const selected = new Map(changed.flatMap((module) => module.children.map((child) => [child.key, child.types.includes("Access")] as const)));
  return Object.fromEntries(base.flatMap((module) => module.children.flatMap((child) => {
    const next = selected.get(child.key);
    return next === undefined || next === child.types.includes("Access") ? [] : [[child.key, next] as const];
  })));
}
