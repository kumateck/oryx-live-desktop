/** The edit area's tabs, in Oryx Next's order. `ready` marks the ones built in the desktop app so far. */
export const productEditTabs = [
  { id: "info", label: "Info", ready: true },
  { id: "spec", label: "Specification", ready: false },
  { id: "packing-style", label: "Packing style", ready: false },
  { id: "bom", label: "Bill of materials", ready: false },
  { id: "packaging", label: "Packing materials", ready: false },
  { id: "procedure", label: "Procedure", ready: false },
  { id: "stp", label: "STP", ready: false },
  { id: "ard", label: "ARD", ready: false },
  { id: "packing-order", label: "Packing order", ready: false },
] as const;
