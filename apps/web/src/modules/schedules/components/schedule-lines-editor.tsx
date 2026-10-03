import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScheduleLinesState } from "../hooks/use-schedule-lines";
import { ScheduleLine } from "./schedule-line";

/** The product lines of a schedule: add, remove, and fill in each one. */
export function ScheduleLinesEditor({ lines, title = "Products" }: { lines: ScheduleLinesState; title?: string }) {
  const { form, options, fields } = lines;
  const listError = form.formState.errors.products?.root?.message ?? form.formState.errors.products?.message;
  return <section className="space-y-3 rounded-lg border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-muted-foreground">Each batch becomes its own entry on the schedule.</p></div>
      <Button type="button" size="sm" variant="outline" onClick={lines.add}><Plus />Add product</Button>
    </div>
    {options.marketsUnavailable ? <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Market types could not be loaded; your account may not be allowed to view customers. The field is optional.
      <Button type="button" size="xs" variant="ghost" onClick={options.retryMarkets}>Retry</Button></p> : null}
    <ul className="space-y-2">{fields.fields.map((field, index) => <ScheduleLine key={field.id} form={form} index={index} options={options}
      onRemove={fields.fields.length > 1 ? () => fields.remove(index) : null} />)}</ul>
    {listError ? <p role="alert" className="text-sm text-destructive">{listError}</p> : null}
  </section>;
}
