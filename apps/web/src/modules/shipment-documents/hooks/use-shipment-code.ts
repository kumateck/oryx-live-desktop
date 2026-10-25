import { useCallback } from "react";
import { settingsApi } from "@/shared/api/generated/settings";
import { useGeneratedCode } from "@/shared/codes/use-generated-code";
import { shipmentKinds, type ShipmentKind } from "../lib/shipment-kinds";

const { useLazyGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;

/** Waybill has its own naming rule, but both delivery kinds live in ShipmentDocument. */
export function useShipmentCode(kind: ShipmentKind) {
  const config = shipmentKinds[kind];
  const [loadCount] = useLazyGetApiV1ConfigurationByModelTypeCountQuery();
  const countRecords = useCallback(async (prefix: string) => {
    return loadCount({ ...config.audit, modelType: "ShipmentDocument", prefix }, false).unwrap();
  }, [loadCount, config.audit]);
  return useGeneratedCode(config.codeModel, countRecords);
}
