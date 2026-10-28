import { formatQuantityNumber, type QuantityOrigin } from "@/shared/units/quantity";

export const reportNumber = (value: number | null, origin: QuantityOrigin = "calculated") =>
  value === null ? "–" : formatQuantityNumber(value, origin);
