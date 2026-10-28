
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import NamedExpressionDialog from "./named-expression-dialog";
import { NamedExpressionScope, type NamedExpressionDefinition } from "./types";

interface Props {
  disabled?: boolean | undefined;
  expressions: NamedExpressionDefinition[];
  onChange: (next: NamedExpressionDefinition[]) => void;
  onInsert: (key: string) => void;
}

export default function NamedExpressionEditor({
  disabled,
  expressions,
  onChange,
  onInsert,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const showEditor = (index: number | null) => {
    setEditingIndex(index);
    setOpen(true);
  };
  const editingItem =
    editingIndex === null ? undefined : expressions[editingIndex];
  const occupiedKeys = new Set(
    expressions.flatMap((item, index) =>
      index === editingIndex ? [] : [item.key],
    ),
  );

  return (
    <section className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Named expressions</h3>
          <p className="text-xs text-muted-foreground">
            Build reusable calculations, then insert their keys into the final
            expression.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => showEditor(null)}
          disabled={disabled}
        >
          <Plus className="mr-1 h-4 w-4" /> Add expression
        </Button>
      </div>

      {expressions.length === 0 ? (
        <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          No named expressions yet.
        </p>
      ) : (
        <div className="space-y-2">
          {expressions.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-semibold text-info">:{item.key}</code>
                  <span className="text-sm">{item.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-sm">
                    {item.scope === NamedExpressionScope.PerSample
                      ? "per sample"
                      : "global"}
                  </span>
                </div>
                <code className="block truncate text-xs text-muted-foreground">
                  {item.expression}
                </code>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onInsert(item.key)}
                  disabled={disabled}
                >
                  Insert
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => showEditor(index)}
                  disabled={disabled}
                  aria-label={`Edit ${item.label}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onChange(
                      expressions.filter((_, current) => current !== index),
                    )
                  }
                  disabled={disabled}
                  aria-label={`Delete ${item.label}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NamedExpressionDialog
        open={open}
        item={editingItem}
        occupiedKeys={occupiedKeys}
        onOpenChange={setOpen}
        onSave={(item) => {
          onChange(
            editingIndex === null
              ? [...expressions, item]
              : expressions.map((current, index) =>
                  index === editingIndex ? item : current,
                ),
          );
          setOpen(false);
        }}
      />
    </section>
  );
}
