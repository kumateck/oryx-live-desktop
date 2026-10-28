import React, { useRef, useCallback } from "react";

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  onDeleteLastKey?: (() => void) | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null> | undefined;
}

export const ExpressionInput: React.FC<ExpressionInputProps> = ({
  value,
  onChange,
  onDeleteLastKey,
  disabled = false,
  className = "",
  textareaRef: externalRef,
}) => {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalRef || internalRef;

  const handleDeleteLastKey = useCallback(() => {
    if (onDeleteLastKey) {
      onDeleteLastKey();
      return;
    }

    // Default implementation if no handler provided
    const re = /:([A-Za-z0-9_]+)\b/g;
    let lastMatch: RegExpExecArray | null = null;
    let m;
    while ((m = re.exec(value))) {
      lastMatch = m;
    }
    if (!lastMatch) return;
    const idx = lastMatch.index;
    const len = lastMatch[0].length;
    const newExpr = value.slice(0, idx) + value.slice(idx + len);
    onChange(newExpr);
  }, [value, onChange, onDeleteLastKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Expression Input
        </label>
        <button
          type="button"
          onClick={handleDeleteLastKey}
          className="rounded-md bg-muted/70 hover:bg-muted active:bg-muted text-foreground px-2.5 py-1 text-xs font-medium shadow-sm transition-colors"
          title="Delete last inserted variable token"
          disabled={disabled || value.length === 0}
        >
          Delete Last Key
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-36 p-2.5 bg-muted/30 text-foreground border border-border rounded-md resize-y font-mono text-base focus:outline-none focus:ring-2 focus:ring-info/40 focus:border-transparent transition-all ${className}`}
        spellCheck={false}
        aria-label="Expression Input"
        disabled={disabled}
      />

      <div className="bg-muted border border-border rounded-md p-2.5">
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-medium">Syntax:</span> Define variables as{" "}
          <code className="bg-background border border-border px-1 py-0.5 rounded text-info font-semibold">
            :name
          </code>
          . Use standard operators{" "}
          <code className="bg-background border border-border px-1 py-0.5 rounded font-semibold">
            + - * /
          </code>{" "}
          and parentheses for grouping.
        </p>
      </div>
    </div>
  );
};
