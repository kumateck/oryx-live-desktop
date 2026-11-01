import { api } from "@/shared/api/base-api";
import { materialsApi } from "@/shared/api/generated/materials";
import type {
  DomainEntitiesMaterialsStockMigrationsStockMigrationComparisonDto as ComparisonDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationDto as MigrationDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationLineDto as LineDto,
  DomainEntitiesMaterialsStockMigrationsStockMigrationLineStatus as LineStatus,
  DomainEntitiesMaterialsStockMigrationsStockMigrationWarehouseDto as WarehouseDto,
  DomainEntitiesMaterialsStockMigrationsUpdateStockMigrationLineRequest as LineUpdate,
} from "@/shared/api/generated/materials";

export type { ComparisonDto, LineDto, LineStatus, LineUpdate, MigrationDto, WarehouseDto };

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
}) });

export const stockMigrationApi = {
  useUploadMutation: uploadApi.useUploadStockMigrationMutation,
  useListQuery: materialsApi.useGetApiV1StockMigrationsQuery,
  useMigrationQuery: materialsApi.useGetApiV1StockMigrationsByIdQuery,
  useLinesQuery: materialsApi.useGetApiV1StockMigrationsByIdLinesQuery,
  useComparisonQuery: materialsApi.useGetApiV1StockMigrationsByIdComparisonQuery,
  useUpdateLineMutation: materialsApi.usePutApiV1StockMigrationsByIdLinesAndLineIdMutation,
  useBulkUpdateMutation: materialsApi.usePutApiV1StockMigrationsByIdLinesMutation,
  useUpdateUnitsMutation: materialsApi.usePutApiV1StockMigrationsByIdUnitsMutation,
  useRecheckMutation: materialsApi.usePostApiV1StockMigrationsByIdRecheckMutation,
  useApproveMutation: materialsApi.usePostApiV1StockMigrationsByIdApproveMutation,
  useDiscardMutation: materialsApi.useDeleteApiV1StockMigrationsByIdMutation,
};
