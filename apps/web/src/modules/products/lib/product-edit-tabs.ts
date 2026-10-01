/** The edit area's tabs, in Oryx Next's order. `ready` marks the ones built in the desktop app so far. */
export const productEditTabs = [
  { id: "info", label: "Info", ready: true },
  { id: "spec", label: "Specification", ready: true },
  { id: "packing-style", label: "Packing style", ready: true },
  { id: "bom", label: "Bill of materials", ready: true },
  { id: "packaging", label: "Packing materials", ready: true },
  { id: "procedure", label: "Procedure", ready: true },
  { id: "stp", label: "STP", ready: true },
  { id: "ard", label: "ARD", ready: true },
  { id: "packing-order", label: "Packing order", ready: true },
] as const;
