import React from "react";

interface ControlsPanelProps {
  showPercentage: boolean;
  onTogglePercentage: (checked: boolean) => void;
  decimalPlaces: number | "";
  onDecimalPlacesChange: (value: string) => void;
  disabled?: boolean | undefined;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  showPercentage,
  onTogglePercentage,
  decimalPlaces,
  onDecimalPlacesChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-4 bg-muted/30 border border-border rounded-md px-3 py-2">
      <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-foreground transition-colors">
        <input
          type="checkbox"
          checked={showPercentage}
          onChange={(e) => onTogglePercentage(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border text-info focus:ring-2 focus:ring-info/40 focus:ring-offset-0 cursor-pointer"
          aria-label="Show result as percent"
          disabled={disabled}
        />
        <span className="font-medium">Percentage</span>
      </label>

      <div className="h-3.5 w-px bg-accent"></div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-foreground">Decimals</label>
        <input
          type="number"
          min={0}
          max={10}
          step={1}
          value={decimalPlaces === "" ? "" : String(decimalPlaces)}
          onChange={(e) => onDecimalPlacesChange(e.target.value)}
          className="w-16 bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground font-medium tabular-nums focus:outline-none focus:ring-1 focus:ring-info/40 focus:border-border transition-all"
          aria-label="Decimal places"
          placeholder="auto"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
