import { ScorecardsSection } from "./scorecards-section";
import { SpendSection } from "./spend-section";

/** Mount only the sections the user is allowed to read. */
export default function PerformancePanel({ supplierId, showPerformance, showSpend }: {
  supplierId: string; showPerformance: boolean; showSpend: boolean;
}) {
  return <div className="grid min-w-0 gap-4 xl:grid-cols-2">
    {showPerformance ? <ScorecardsSection supplierId={supplierId} /> : null}
    {showSpend ? <SpendSection supplierId={supplierId} /> : null}
  </div>;
}
