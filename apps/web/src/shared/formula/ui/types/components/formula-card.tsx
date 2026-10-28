import React from "react";
import ExpressionRenderer from "@/shared/formula/ui/math/expression-view";

interface FormulaCardProps {
  title: string;
  expression: string;
  result?: number | string | null | undefined;
  showPercentage?: boolean | undefined;
  className?: string | undefined;
  subtitle?: string | undefined;
  showFootnote?: boolean | undefined;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  expression,
  result,
  showPercentage = false,
  className = "bg-muted",
  subtitle,
  showFootnote = false,
}) => {
  return (
    <div className="bg-background border border-border rounded-md p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`w-1 h-4 ${className} rounded-full`}></div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {showPercentage && (
            <span className="text-xs bg-muted text-foreground font-bold px-1.5 py-0.5 rounded">
              %
            </span>
          )}
        </div>
      </div>

      <div className="bg-muted/30 rounded-md p-3 border border-border">
        <ExpressionRenderer
          expression={expression}
          option={{ append100: showPercentage, result }}
          className="bg-transparent"
          fallbackToText
        />
      </div>

      {showFootnote && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted border border-border rounded px-2 py-1.5">
          <svg
            className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="leading-tight">
            Empty variables display as names until values are assigned.
          </span>
        </div>
      )}
    </div>
  );
};
