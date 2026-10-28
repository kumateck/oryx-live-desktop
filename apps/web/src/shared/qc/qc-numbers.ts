import { useCallback } from "react";
import { settingsApi } from "@/shared/api/generated/settings";

const audit = { module: "Settings", subModule: "Code Settings" } as const;

/** "QCD/RM/26/0001": department, material type or product stage, two-digit year and a four-digit serial. */
export const arNumberPrefix = (type: "RM" | "PM" | "IP" | "BP" | "FP", year: number) => `QCD/${type}/${String(year).slice(-2)}`;
export const arNumber = (prefix: string, serial: number) => `${prefix}/${String(serial).padStart(4, "0")}`;
/** "26/0007": the year and a serial, given when a test is first assigned. */
export const issueNumber = (year: number, serial: number) => `${String(year).slice(-2)}/${String(serial).padStart(4, "0")}`;

/**
 * The next number of a kind from the count the server keeps. It is a suggestion: two people working at
 * the same moment can get the same one, and the server decides whether it is accepted.
 */
export function useNextSerial() {
  const [loadCount] = settingsApi.useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  return useCallback(async (modelType: "ArNumberMaterial" | "ArNumberProduct" | "MaterialBatchIssueNumber" | "AtrIssueNumber" | "MaterialSpecNumber" | "ProductSpecNumber" | "MaterialSTPNumber" | "ProductSTPNumber", prefix: string) => {
    const count = await loadCount({ ...audit, modelType, prefix }).unwrap().catch(() => null);
    return typeof count === "number" ? count + 1 : null;
  }, [loadCount]);
}
