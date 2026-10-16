import React from "react";

interface ResultDisplayProps {
  result: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  return (
    <div className="flex items-center gap-1.5 bg-muted text-foreground rounded px-2 py-1">
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-90">
        Result
      </span>
      <span className="text-sm font-bold tabular-nums">{result}</span>
    </div>
  );
};
