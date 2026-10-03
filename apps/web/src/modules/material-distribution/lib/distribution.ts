export const distributionPath = "/procurement/material-distribution";
export const shipmentDistributionPath = (id: string) => `${distributionPath}/${id}/details`;
export const distributionPermissions = { view: "CanViewMaterialDistribution", confirm: "CanDistributeMaterial" } as const;
export const audit = { module: "Procurement", subModule: "Material Distribution" } as const;

interface Share { requested: number; allocated: number }
/** What a material's arrival comes to against what the departments asked for. */
export function sectionTotals(section: { arrived: number; shares: readonly Share[] }) {
  const requested = section.shares.reduce((sum, share) => sum + share.requested, 0);
  const allocated = section.shares.reduce((sum, share) => sum + share.allocated, 0);
  return { requested, allocated, short: Math.max(0, requested - section.arrived), surplus: Math.max(0, section.arrived - requested) };
}

/**
 * Why a material cannot be distributed, or null when it can. A delivery is shared out only once its
 * arrival is approved, and only between departments the server could name.
 */
export function confirmBlock(shipment: { approved: boolean }, section: { shares: readonly { departmentId: string | null }[] }): string | null {
  if (!shipment.approved) return "The arrival has to be approved before its materials are distributed.";
  if (section.shares.length === 0 || section.shares.some((share) => !share.departmentId)) return "A requisition for this material has no department, so there is nowhere to send it.";
  return null;
}

/** How far a material, or one department's part of it, has been shared out: allocated against asked for, as a whole percentage. */
export const sharePercent = (share: Share) => share.requested > 0 ? Math.min(100, Math.round((share.allocated / share.requested) * 100)) : 0;
export function sectionProgress(section: { shares: readonly (Share & { remaining: number })[] }) {
  const requested = section.shares.reduce((sum, share) => sum + share.requested, 0);
  const allocated = section.shares.reduce((sum, share) => sum + share.allocated, 0);
  const remaining = section.shares.reduce((sum, share) => sum + share.remaining, 0);
  return { requested, allocated, remaining, percent: sharePercent({ requested, allocated }) };
}
/** How much of a delivery is fully allocated: materials whose departments are all covered, out of all its materials. */
export function deliveryProgress(sections: readonly { shares: readonly (Share & { remaining: number })[] }[]) {
  const complete = sections.filter((section) => { const progress = sectionProgress(section); return progress.requested > 0 && progress.allocated >= progress.requested; }).length;
  return { complete, of: sections.length, percent: sections.length > 0 ? Math.round((complete / sections.length) * 100) : 0 };
}
export const progressLabel = (percent: number) => percent >= 100 ? "Complete" : percent > 0 ? `${percent}% allocated` : "Pending";

/** Where a material came from: who made it, which orders it was bought on, and the average unit price across those lines. */
export function supplyChain(section: { shares: readonly { sources: readonly { manufacturer: string | null; order: string | null; price: number | null; currency: string | null; priceUnit: string | null }[] }[] }) {
  const sources = section.shares.flatMap((share) => share.sources);
  const prices = sources.flatMap((source) => source.price !== null && source.price > 0 ? [source.price] : []);
  const units = new Set(sources.map((source) => `${source.currency ?? ""}|${source.priceUnit ?? ""}`));
  return { manufacturers: [...new Set(sources.flatMap((source) => source.manufacturer ? [source.manufacturer] : []))], orders: [...new Set(sources.flatMap((source) => source.order ? [source.order] : []))],
    // Prices quoted in different currencies or per different units are not averaged together.
    averagePrice: prices.length > 0 && units.size === 1 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null, currency: sources[0]?.currency ?? null, priceUnit: sources[0]?.priceUnit ?? null };
}
/** Where a department's purchase request stands. The numbers are the server's. */
export const requestStatusLabels: Record<number, string> = { 0: "New", 1: "Pending", 2: "Sourced", 3: "Completed", 4: "Rejected" };
