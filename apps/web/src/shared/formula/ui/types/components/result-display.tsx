import React from "react";

interface ResultDisplayProps {
  result: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  return (
    <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide opacity-90">
        Result
      </span>
      <span className="text-lg font-bold tabular-nums">{result}</span>
    </div>
  );
};
