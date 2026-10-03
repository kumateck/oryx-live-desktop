import { api } from "@/shared/api/base-api";
import { warehouseApi } from "@/shared/api/generated/warehouse";

const list = { type: "Receiving" as const, id: "all" };
const grns = { type: "Grns" as const, id: "all" };

export const receivingApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1WarehouseDistributedRequisitionMaterials: { providesTags: [list] },
    getApiV1WarehouseDistributedMaterialById: { providesTags: [list] },
    getApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklist: { providesTags: [list] },
    getApiV1WarehouseGrns: { providesTags: [grns] },
    getApiV1WarehouseGrnById: { providesTags: [grns] },
  },
});

export interface ChecklistRequest {
  distributedRequisitionMaterialId: string; materialId: string; checkedAt: string; shipmentInvoiceId: string | null; supplierId: string | null; manufacturerId: string | null;
  certificateOfAnalysisDelivered: boolean; visibleLabelling: boolean; intactnessStatus: number; consignmentCarrierStatus: number;
  materialBatches: { materialId: string; batchNumber: string | null; numberOfContainers: number; containerPackageStyleId: string; quantityPerContainer: number; totalQuantity: number; uoMId: string | null;
    dateReceived: string; manufacturingDate: string; expiryDate?: string; sampleWeights: { srNumber: string; grossWeight: number }[] }[];
}
export interface GrnRequest { grnNumber: string; declarationNumber: string | null; carrierName: string; vehicleNumber: string; remarks: string | null; materialBatchIds: string[] }
interface Audit { module: string; subModule: string }

/** The server's create actions for checklists and goods received notes are not in its published contract, so they are declared here. */
const writeApi = api.injectEndpoints({
  endpoints: (build) => ({
    createChecklist: build.mutation<string, Audit & { body: ChecklistRequest }>({
      query: ({ body, module, subModule }) => ({ url: "/api/v1/warehouse/checklist", method: "POST", body, headers: { Module: module, SubModule: subModule } }),
      invalidatesTags: (_result, error) => error ? [] : [list],
    }),
    createGrn: build.mutation<string, Audit & { body: GrnRequest }>({
      query: ({ body, module, subModule }) => ({ url: "/api/v1/warehouse/grn", method: "POST", body, headers: { Module: module, SubModule: subModule } }),
      invalidatesTags: (_result, error) => error ? [] : [list, grns],
    }),
  }),
});

export const { useGetApiV1WarehouseDistributedRequisitionMaterialsQuery, useGetApiV1WarehouseDistributedMaterialByIdQuery, useGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistQuery,
  usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation, useGetApiV1WarehouseGrnsQuery, useGetApiV1WarehouseGrnByIdQuery } = receivingApi;
export const { useCreateChecklistMutation, useCreateGrnMutation } = writeApi;
