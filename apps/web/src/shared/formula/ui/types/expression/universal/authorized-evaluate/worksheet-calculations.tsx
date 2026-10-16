import BestMath from "@/shared/formula/ui/math/expression-view";

interface CalculationResult {
  result: number | null;
  sample: string;
  substitutedExpression: string;
}

interface WorksheetCalculationsProps {
  averageResult: number | null;
  expression: string;
  formatNumber: (value: number | null) => string;
  percentageResults?: boolean | undefined;
  results: CalculationResult[];
}

export const WorksheetCalculations = ({
  averageResult,
  expression,
  formatNumber,
  percentageResults,
  results,
}: WorksheetCalculationsProps) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
        Calculations
      </h3>
      {averageResult !== null ? (
        <div className="text-sm font-semibold text-foreground">
          Average: {formatNumber(averageResult)}
        </div>
      ) : null}
    </div>
    <BestMath
      expression={expression}
      option={{ append100: percentageResults, result: null }}
    />
    {results.map((entry, index) => (
      <div
        key={`${entry.sample}-${index}`}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="min-w-24 text-sm font-semibold text-foreground">
          {entry.sample}
        </div>
        <div className="min-w-0 flex-1">
          <BestMath
            expression={entry.substitutedExpression}
            option={{
              append100: percentageResults,
              result: entry.result === null ? null : formatNumber(entry.result),
            }}
          />
        </div>
      </div>
    ))}
  </section>
);
