import { useSearchParams } from "react-router";

/** One store-balance period is shared by the tabs and every separate/combined report. */
export function useStockPeriod() {
  const [params, setParams] = useSearchParams();
  const now = new Date();
  const fallback = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const requested = params.get("stockSince");
  const since = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : fallback;
  const select = (value: string) => setParams((current) => { const next = new URLSearchParams(current); next.set("stockSince", value); next.delete("page"); return next; }, { replace: true });
  return [since, select] as const;
}
