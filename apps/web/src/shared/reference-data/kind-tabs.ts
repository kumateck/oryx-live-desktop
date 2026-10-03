import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useAccess } from "@/shared/auth/use-access";

export type MaterialKind = 0 | 1;
export const materialKindLabels: Record<MaterialKind, string> = { 0: "Raw", 1: "Packaging" };

/**
 * Raw and packaging materials are separate lists behind separate permissions. This gives the
 * kinds the user may see, and the one that is open, kept in the address as `?type=` so it
 * survives reload and can be linked. A kind the user may not see is never opened, whatever the address says.
 */
export function useKindTabs(permissions: Record<MaterialKind, string>) {
  const { has, allowsNow } = useAccess();
  const [params, setParams] = useSearchParams();
  const allowed = useMemo(() => ([0, 1] as const).filter((kind) => has(permissions[kind])), [has, permissions]);
  const requested = params.get("type") === "1" ? 1 : 0;
  const kind: MaterialKind | null = allowed.includes(requested) ? requested : allowed[0] ?? null;
  const select = useCallback((next: MaterialKind) => {
    if (!allowsNow(permissions[next])) return;
    setParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set("type", String(next));
    updated.delete("page");
    return updated;
    }, { replace: true });
  }, [setParams, allowsNow, permissions]);
  const requestedParam = params.get("type");
  useEffect(() => {
    if (kind !== null && ((requestedParam !== null && requestedParam !== String(kind)) || kind !== requested)) select(kind);
  }, [kind, requested, requestedParam, select]);
  return { kind, select, tabs: allowed.map((value) => ({ id: String(value), value, label: materialKindLabels[value] })) };
}
