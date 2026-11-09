import { api } from "@/shared/api/base-api";
import { materialsApi } from "@/shared/api/generated/materials";
import { addTags } from "@/shared/api/add-tags";
import type {
  DomainEntitiesMaterialsStockMigrationsStockMigrationComparisonDto as ComparisonDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationDto as MigrationDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationLineDto as LineDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationLineStatus as LineStatus,
  DomainEntitiesMaterialsStockMigrationsStockMigrationWarehouseDto as WarehouseDto,
  DomainEntitiesMaterialsStockMigrationsUpdateStockMigrationLineRequest as LineUpdate,
  DomainEntitiesMaterialsStockMigrationsStockMigrationMaterialLinkDto as MaterialLinkDto,
} from "@/shared/api/generated/materials";

export type { ComparisonDto, LineDto, LineStatus, LineUpdate, MigrationDto, WarehouseDto, MaterialLinkDto };

const reviewedApi = materialsApi.enhanceEndpoints({ endpoints: {
  createStockMigrationMaterialLinks: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "material", id: "LIST" }]);
  },
  postApiV1StockMigrationsByIdApprove: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "StockOnShelves", id: "all" }]);
  },
} });

/** Audit headers for every stock migration request, as for the other Upload Center uploads. */
export const migrationAudit = { module: "Settings", subModule: "Configurations" } as const;

// The upload is multipart, which the generated client does not describe correctly, so it is declared here.
const uploadApi = api.injectEndpoints({ endpoints: (build) => ({
  uploadStockMigration: build.mutation<string, { file: File; departmentId: string; massUnit: string; volumeUnit: string }>({
    query: ({ file, departmentId, massUnit, volumeUnit }) => {
      const body = new FormData();
      body.append("file", file, file.name);
      return { url: "/api/v1/stock-migrations", method: "POST", body, params: { departmentId, massUnit, volumeUnit },
        headers: { Module: migrationAudit.module, SubModule: migrationAudit.subModule } };
    },
    invalidatesTags: (_id, error) => error ? [] : [{ type: "stock-migration", id: "LIST" }],
  }),
  uploadStockTopUp: build.mutation<string, { file: File; departmentId: string; reason: string; massUnit: string; volumeUnit: string }>({
    query: ({ file, ...params }) => {
      const body = new FormData();
      body.append("file", file, file.name);
      return { url: "/api/v1/stock-migrations/top-ups/upload", method: "POST", body, params,
        headers: { Module: migrationAudit.module, SubModule: migrationAudit.subModule } };
    },
    invalidatesTags: (_id, error) => error ? [] : [{ type: "stock-migration", id: "LIST" }],
  }),
}) });

export const stockMigrationApi = {
  useMaterialLinksQuery: materialsApi.usePreviewStockMigrationMaterialLinksQuery,
  useCreateMaterialLinksMutation: reviewedApi.useCreateStockMigrationMaterialLinksMutation,
  useUploadMutation: uploadApi.useUploadStockMigrationMutation,
  useUploadTopUpMutation: uploadApi.useUploadStockTopUpMutation,
  useCreateTopUpMutation: materialsApi.usePostApiV1StockMigrationsTopUpsMutation,
  useListQuery: materialsApi.useGetApiV1StockMigrationsQuery,
  useMigrationQuery: materialsApi.useGetApiV1StockMigrationsByIdQuery,
  useLinesQuery: materialsApi.useGetApiV1StockMigrationsByIdLinesQuery,
  useComparisonQuery: materialsApi.useGetApiV1StockMigrationsByIdComparisonQuery,
  useUpdateLineMutation: materialsApi.usePutApiV1StockMigrationsByIdLinesAndLineIdMutation,
  useBulkUpdateMutation: materialsApi.usePutApiV1StockMigrationsByIdLinesMutation,
  useUpdateUnitsMutation: materialsApi.usePutApiV1StockMigrationsByIdUnitsMutation,
  useRecheckMutation: materialsApi.usePostApiV1StockMigrationsByIdRecheckMutation,
  useApproveMutation: reviewedApi.usePostApiV1StockMigrationsByIdApproveMutation,
  useDiscardMutation: materialsApi.useDeleteApiV1StockMigrationsByIdMutation,
};
