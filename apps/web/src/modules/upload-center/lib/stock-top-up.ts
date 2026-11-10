import type { LineUpdate } from "../api/stock-migration-api";
import type { TopUpLineValues } from "../schemas/stock-top-up-schema";
import { monthValue } from "./stock-migration";

export function topUpLineRequest(line: TopUpLineValues): LineUpdate {
  return {
    materialCode: line.materialCode, batchNumber: line.batchNumber,
    unitSymbol: line.unitSymbol, quantityInSheet: Number(line.quantity),
    warehouseName: line.warehouseName || null, shelfName: line.shelfName || null,
    manufacturingDate: line.manufactured ? monthValue(line.manufactured) : null,
    expiryDate: line.expiry ? monthValue(line.expiry) : null,
    retestDate: line.retest ? monthValue(line.retest) : null,
    grn: line.grn || null, arNumber: line.arNumber || null,
  };
}
