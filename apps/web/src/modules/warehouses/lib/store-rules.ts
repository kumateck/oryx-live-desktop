/** What a store is for. The numbers are the server's. */
export const storeTypes = [{ value: "0", label: "Raw materials" }, { value: "1", label: "Packaging materials" }, { value: "2", label: "Finished goods" }, { value: "3", label: "Production floor" }] as const;
export const storeTypeLabel = (type: number): string => storeTypes.find((item) => item.value === String(type))?.label ?? "Other";

/** The server has one permission for stores. Until it has more, whoever may see stores may set them up. */
export const storePermission = "CanViewWarehouses";
export const locationPermissions = { view: "CanViewLocations", add: "CanAddNewLocation", edit: "CanEditLocation", remove: "CanDeleteLocation" } as const;
export const storeAudit = { module: "Settings", subModule: "Warehouses" } as const;
export const locationAudit = { module: "Settings", subModule: "Locations" } as const;

/**
 * Why a store's details cannot be changed or the store removed, or null when they can. The server saves
 * a store by replacing its locations, which would take every rack, shelf and stock record with them.
 */
export function storeChangeBlock(store: { locations: number }): string | null {
  return store.locations === 0 ? null : `This store has ${store.locations} ${store.locations === 1 ? "location" : "locations"}. Saving or removing it would remove them, with their racks, shelves and the stock recorded on them, so it cannot be changed here.`;
}

/** The same for a location and its racks. */
export function locationChangeBlock(location: { racks: number }): string | null {
  return location.racks === 0 ? null : `This location has ${location.racks} ${location.racks === 1 ? "rack" : "racks"}. Saving or removing it would remove them, with their shelves and the stock recorded on them, so it cannot be changed here.`;
}

export const floors = ["Ground", "First", "Second", "Third", "Fourth", "Fifth"] as const;
const areas: Record<number, readonly string[]> = { 0: ["General", "Active", "Excipient"], 1: ["General", "Foils", "PVC", "PackagingRoom1", "PackagingRoom2"] };
const spaced = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
/** The areas a store of a type is divided into, or null where the house has no fixed list and a name is typed. The value is what the server stores. */
export function locationNames(storeType: number): { value: string; label: string }[] | null {
  return areas[storeType]?.map((name) => ({ value: name, label: spaced(name) })) ?? null;
}
export const locationLabel = (name: string): string => spaced(name);
