import { materialsApi } from "@/shared/api/generated/materials";
import { productionApi } from "@/shared/api/generated/production";

export const { useGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery } = materialsApi;
export const { usePostApiV1ProductionScheduleStockTransferMutation } = productionApi;
