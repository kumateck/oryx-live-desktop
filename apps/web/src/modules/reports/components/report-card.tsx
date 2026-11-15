import { Link } from "react-router";
import { Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportEntry } from "../lib/report-directory";
import { ReportSectionIcon } from "./report-section-icon";

/** One report in the hub. The whole card opens the report; the pin is a separate control above the link. */
export function ReportCard({ entry, pinned, onTogglePin }: { entry: ReportEntry; pinned: boolean; onTogglePin: () => void }) {
  return <li className="group relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 transition-colors focus-within:border-ring hover:border-foreground/25">
    <div className="flex items-start justify-between gap-2">
      <ReportSectionIcon section={entry.section} />
      <Button type="button" variant="ghost" size="icon-sm" className="relative z-10 text-muted-foreground" aria-pressed={pinned}
        aria-label={pinned ? `Unpin ${entry.title}` : `Pin ${entry.title}`} onClick={onTogglePin}>
        {pinned ? <PinOff /> : <Pin />}
      </Button>
    </div>
    <div className="min-w-0 space-y-1">
      <h3 className="text-sm font-medium leading-snug">
        <Link to={`/reports/${entry.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']">{entry.title}</Link>
      </h3>
      <p className="line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>
    </div>
    {entry.views.length > 1 ? <p className="mt-auto text-xs text-muted-foreground">{entry.views.map((view) => view.label).join(" · ")}</p> : null}
  </li>;
}
