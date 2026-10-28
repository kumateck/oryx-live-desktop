import type { TableConfig } from "@/shared/questions/table-question";

export const tableConfig: TableConfig = {
  rows: 4,
  cols: 3,
  cellConfigs: {
    "0-0": {
      type: "label",
      colspan: 3,
      label:
        "Growth Promotion, Sterility and Inhibitory Properties of the Culture Media",
    },
    "0-1": { type: "empty", isMerged: true },
    "0-2": { type: "empty", isMerged: true },
    "1-0": { type: "label", label: "" },
    "1-1": { type: "label", label: "MacConkey Broth" },
    "1-2": { type: "label", label: "MacConkey Agar" },
    "2-0": { type: "label", label: "Medium Batch no:" },
    "2-1": { type: "label", label: "QCD/25/006/0000456693" },
    "2-2": { type: "label", label: "QCD/25/006/0000501027" },
    "3-0": { type: "label", label: "Remark" },
    "3-1": {
      type: "select",
      options: [{ value: "complies", label: "Complies" }],
    },
    "3-2": {
      type: "select",
      options: [{ value: "fails", label: "Does not comply" }],
    },
  },
};

export const tableOptions = [{ name: JSON.stringify(tableConfig) }];
