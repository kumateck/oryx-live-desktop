import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const rackPermissions = { view: "CanViewRacks", add: "CanAddNewRack", edit: "CanEditRack", remove: "CanDeleteRack" } as const;
export const shelfPermissions = { view: "CanViewShelves", add: "CanAddNewShelf", edit: "CanEditShelf", remove: "CanDeleteShelf" } as const;
/** Racks and shelves of raw and packaging stores are listed apart, but behind one permission. */
export const sameForBothKinds = (permission: string): Record<MaterialKind, string> => ({ 0: permission, 1: permission });
export const rackAudit = { module: "Settings", subModule: "Racks" } as const;
export const shelfAudit = { module: "Settings", subModule: "Shelves" } as const;
export const shelvesPath = "/settings/shelves";
