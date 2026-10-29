/** Why packs cannot be counted when a packing style's units do not add up to its packs per shipper. */
export const unitsMismatch = (perShipper: number) =>
  `The packing style's units do not add up to ${perShipper.toLocaleString("en-US")} packs per shipper at any level, so tablets or bottles cannot be counted as packs. Correct the packing style's units or packs per shipper first.`;
