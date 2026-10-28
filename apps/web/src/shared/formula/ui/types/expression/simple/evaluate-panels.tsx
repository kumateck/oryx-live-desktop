import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";

interface VariablesPanelProps {
  labels: Record<string, string>;
  onVarChange: (key: string, value: string) => void;
  varInputs: Record<string, string>;
  varKeys: string[];
}

export const VariablesPanel = ({
  labels,
  onVarChange,
  varInputs,
  varKeys,
}: VariablesPanelProps) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Manual Variables
      </h3>
    </div>

    <div className="flex max-w-3xl flex-col gap-3">
      {varKeys.length === 0 && (
        <div className="py-1 text-xs italic text-muted-foreground">
          No variables detected in the formula.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {varKeys.map((key) => (
          <label
            key={key}
            htmlFor={`value-${key}`}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2"
          >
            <span className="text-sm text-foreground">
              {labels[key] || key} ({key}):
            </span>
            <input
              id={`value-${key}`}
              type="text"
              inputMode="decimal"
              value={varInputs[key] ?? ""}
              onChange={(event) => onVarChange(key, event.target.value)}
              className="min-w-0 flex-1 rounded-none border-0 border-b border-border bg-background px-2.5 py-1.5 text-sm text-foreground transition-all focus:rounded focus:border focus:border-border focus:outline-none focus:ring-1 focus:ring-info/40"
              aria-label={`Value for ${labels[key] || key} (${key})`}
            />
          </label>
        ))}
      </div>
    </div>
  </section>
);

interface PreviewPanelProps {
  displayResult: string;
  percent: boolean;
  substitutedExpression: string;
}

export const PreviewPanel = ({
  displayResult,
  percent,
  substitutedExpression,
}: PreviewPanelProps) => (
  <section className="flex flex-col gap-3">
    <div>
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Results
      </h3>
    </div>

    <ExpressionRenderer
      expression={substitutedExpression}
      option={{ append100: percent, result: displayResult }}
      className="bg-transparent"
      fallbackToText
    />
  </section>
);
