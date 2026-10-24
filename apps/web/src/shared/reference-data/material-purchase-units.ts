import { materialsApi } from "@/shared/api/generated/materials";

/** Read-only, authenticated units from every department linked to the material. */
export const {
  useGetApiV1MaterialByMaterialIdPurchaseUnitsQuery: useMaterialPurchaseUnitsQuery,
  useLazyGetApiV1MaterialByMaterialIdPurchaseUnitsQuery: useLazyMaterialPurchaseUnitsQuery,
} = materialsApi;
