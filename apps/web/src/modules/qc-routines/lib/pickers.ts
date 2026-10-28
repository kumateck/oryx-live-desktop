import { useCallback } from "react";
import { productionApi } from "@/shared/api/generated/production";
import { rndApi } from "@/shared/api/generated/rnd";
import type { SelectLoader } from "@/shared/forms/form-wizard-types";

// Oryx Next asked for R&D batch, batch record and production step IDs as typed text; these offer the records instead.
const audit = { module: "Quality Control", subModule: "Routine Tests" } as const;
function paged<T>(result: { data?: T[] | null; pageIndex?: number; pageCount?: number }, page: number, pick: (item: T) => { value: string; label: string } | null) {
  const current = result.pageIndex ?? page;
  return { options: (result.data ?? []).flatMap((item) => { const option = pick(item); return option ? [option] : []; }), hasNext: current < (result.pageCount ?? current), hasPrevious: current > 1 };
}

export function useRndProjectOptions(): SelectLoader {
  const [load] = rndApi.useLazyGetApiV1RndProjectsQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    return paged(await request.unwrap(), page, (project) => project.id ? { value: project.id, label: [project.code, project.title].filter(Boolean).join(" · ") || "Project" } : null);
  }, [load]);
}

export function useRndBatchOptions(projectId: string | null): SelectLoader {
  const [load] = rndApi.useLazyGetApiV1RndProjectsByRndProjectIdTrialBatchesQuery();
  return useCallback<SelectLoader>(async (_search, page, signal) => {
    if (!projectId) return { options: [], hasNext: false, hasPrevious: false };
    const request = load({ ...audit, rndProjectId: projectId, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    return paged(await request.unwrap(), page, (batch) => batch.id ? { value: batch.id, label: batch.batchCode ?? "Trial batch" } : null);
  }, [load, projectId]);
}

/** Batch manufacturing records, remembering each one's scheduled product so its production steps can be offered. */
export function useBatchRecordOptions(products: Map<string, string>): SelectLoader {
  const [load] = productionApi.useLazyGetApiV1ProductionScheduleManufacturingQuery();
  return useCallback<SelectLoader>(async (search, page, signal) => {
    const request = load({ ...audit, searchQuery: search, page, pageSize: 20 });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    return paged(await request.unwrap(), page, (record) => {
      if (!record.id) return null;
      if (record.productionScheduleProduct?.id) products.set(record.id, record.productionScheduleProduct.id);
      return { value: record.id, label: [record.batchNumber, record.productionScheduleProduct?.product?.name].filter(Boolean).join(" · ") || "Batch record" };
    });
  }, [load, products]);
}

/** The production steps of a batch record's activity. */
export function useStepOptions(scheduleProductId: string | null): SelectLoader {
  const [load] = productionApi.useLazyGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery();
  return useCallback<SelectLoader>(async (search, _page, signal) => {
    if (!scheduleProductId) return { options: [], hasNext: false, hasPrevious: false };
    const request = load({ ...audit, productionScheduleProductId: scheduleProductId });
    signal.addEventListener("abort", () => request.abort(), { once: true });
    const activity = await request.unwrap().catch(() => null);
    const term = search.trim().toLowerCase();
    return { options: (activity?.steps ?? []).flatMap((step) => step.id ? [{ value: step.id, label: step.operation?.name?.trim() || "Step" }] : [])
      .filter((option) => !term || option.label.toLowerCase().includes(term)), hasNext: false, hasPrevious: false };
  }, [load, scheduleProductId]);
}
