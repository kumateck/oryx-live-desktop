import { missingStockLocation } from "./stock-location";

/** A batch's picking location stays below its number and wraps inside the existing table cell. */
export function StockBatchLocation({ locations }: { locations: readonly (string | null | undefined)[] }) {
  const recorded = [...new Set(locations.filter((location): location is string => Boolean(location)))];
  return <div className="min-w-0 break-normal text-xs text-muted-foreground [overflow-wrap:anywhere]">
    {recorded.length ? recorded.map((location) => <div key={location}>{location}</div>) : missingStockLocation}
  </div>;
}
