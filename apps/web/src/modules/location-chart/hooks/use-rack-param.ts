import { useCallback } from "react";
import { useSearchParams } from "react-router";
import type { RackSummary } from "../schemas/rack-schema";

/** The open rack, kept in the address as `?rack=`. An id that is not one of the department's racks falls back to the first. */
export function useRackParam(racks: readonly RackSummary[]) {
  const [params, setParams] = useSearchParams();
  const requested = params.get("rack");
  const rackId = racks.find((rack) => rack.id === requested)?.id ?? racks[0]?.id ?? null;
  const select = useCallback((id: string) => setParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set("rack", id);
    return updated;
  }, { replace: true }), [setParams]);
  return { rackId, select };
}
