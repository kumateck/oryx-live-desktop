import { CircleX } from "lucide-react";
import { formatDateTime } from "@/shared/format/dates";

/** Why a request was refused, by whom and when, with what the reader can do next. */
export function RefusalNotice({ title, reason, by, at, next }: { title: string; reason: string | null | undefined; by?: string | null | undefined; at?: string | null | undefined; next?: string | undefined }) {
  const when = formatDateTime(at ?? null);
  return <section role="status" aria-label={title} className="space-y-1.5 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
    <h2 className="flex items-center gap-2 font-semibold text-destructive"><CircleX aria-hidden="true" className="size-4" />{title}</h2>
    <p className="whitespace-pre-wrap break-words">{reason?.trim() || "No reason was recorded."}</p>
    {by || when ? <p className="text-xs text-muted-foreground">{[by ? `By ${by}` : null, when].filter(Boolean).join(" · ")}</p> : null}
    {next ? <p className="text-muted-foreground">{next}</p> : null}
  </section>;
}
