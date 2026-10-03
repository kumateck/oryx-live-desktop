import type { StorageLocation, StorageRack } from "../schemas/rack-schema";

/** 0 is A, 25 is Z, 26 is AA: the letters shelves are named by. */
export function letters(index: number): string {
  let value = Math.max(Math.floor(index), 0);
  let text = "";
  do { text = String.fromCharCode(65 + (value % 26)) + text; value = Math.floor(value / 26) - 1; } while (value >= 0);
  return text;
}

/** The next free rack name in a location, in the house style "<floor initial>/<number>": G/03. */
export function suggestRackName(location: StorageLocation): string {
  const floor = (location.floor ?? location.name).trim().charAt(0).toUpperCase() || "R";
  const taken = new Set(location.rackNames.map((name) => name.trim().toUpperCase()));
  for (let number = location.rackNames.length + 1; ; number += 1) {
    const name = `${floor}/${String(number).padStart(2, "0")}`;
    if (!taken.has(name)) return name;
  }
}

/** A shelf code in the house style "<store initial>/<RM|PM>/<rack>/<letter>": W/RM/G/03/A. */
export function suggestShelfCode(location: Pick<StorageLocation, "warehouse" | "kind"> | null, rackName: string, index: number): string {
  const store = location?.warehouse?.trim().charAt(0).toUpperCase() || "S";
  return [store, location?.kind === 1 ? "PM" : "RM", rackName.trim() || "RACK", letters(index)].join("/");
}

/**
 * Why a rack's details cannot be changed, or null when they can. The server saves a rack by replacing
 * its shelves with new ones, which would cut every stock record off from the shelf it is on.
 */
export function rackEditBlock(rack: Pick<StorageRack, "shelves">): string | null {
  const used = rack.shelves.filter((shelf) => shelf.stockRecords > 0).length;
  return used === 0 ? null : `${used} of this rack's shelves ${used === 1 ? "has" : "have"} stock records. Saving the rack would replace its shelves and detach that stock, so it cannot be changed here. Shelves can still be renamed and added on the Shelves page.`;
}

/** Why a rack cannot be removed, or null when it can. */
export function rackRemoveBlock(rack: Pick<StorageRack, "shelves">): string | null {
  const holding = rack.shelves.filter((shelf) => shelf.inStock).length;
  return holding === 0 ? null : `${holding} of this rack's shelves still ${holding === 1 ? "holds" : "hold"} stock. Move the stock to another rack first.`;
}

/** Shelf names and codes that appear more than once, lower-cased. The server refuses a repeated name. */
export function repeated(values: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const value of values.map((item) => item.trim().toLowerCase()).filter(Boolean)) { if (seen.has(value)) twice.add(value); seen.add(value); }
  return twice;
}
