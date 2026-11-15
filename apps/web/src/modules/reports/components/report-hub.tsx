import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePinnedReports } from "../hooks/use-pinned-reports";
import { entryRequirement, reportEntries, reportSections, type ReportEntry, type ReportSectionId } from "../lib/report-directory";
import { ReportCard } from "./report-card";

function matches(entry: ReportEntry, query: string) {
  const text = `${entry.title} ${entry.description} ${entry.views.map((view) => view.label).join(" ")}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}

/** Every report the user may run, in one place, grouped by subject. Reports the user cannot run are not shown. */
export function ReportHub() {
  const access = useAccess(); const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const { pinned, toggle } = usePinnedReports(user?.id ?? null);
  const query = params.get("q") ?? "";
  const visible = useMemo(() => reportEntries.filter((entry) => access.can(entryRequirement(entry))), [access]);
  const sections = reportSections.filter((section) => visible.some((entry) => entry.section === section.id));
  const chosen = sections.find((section) => section.id === params.get("section"))?.id ?? null;
  const update = (next: { section?: ReportSectionId | null; q?: string }) => setParams((current) => {
    const result = new URLSearchParams(current);
    for (const [name, value] of Object.entries(next)) if (value) result.set(name, value); else result.delete(name);
    return result;
  }, { replace: true });
  const filtered = visible.filter((entry) => (!chosen || entry.section === chosen) && (!query || matches(entry, query)));
  const pinnedEntries = !chosen && !query ? filtered.filter((entry) => pinned.includes(entry.slug)) : [];
  const card = (entry: ReportEntry) => <ReportCard key={entry.slug} entry={entry} pinned={pinned.includes(entry.slug)} onTogglePin={() => toggle(entry.slug)} />;
  const grid = "grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3";

  return <article className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <PageHeader title="Reports" crumbs={[{ label: "Reports" }]} />
      <label className="relative w-full max-w-xs"><span className="sr-only">Search reports</span>
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" value={query} placeholder="Search reports" className="pl-8" onChange={(event) => update({ q: event.target.value })} />
      </label>
    </div>
    {visible.length === 0 ? <p role="status" className="text-sm text-muted-foreground">No reports are available for your role. Ask an administrator if you need one for your work.</p> : <>
      <nav aria-label="Report groups" className="flex flex-wrap gap-2">
        {[{ id: null, title: "All", count: visible.length }, ...sections.map((section) => ({ id: section.id, title: section.title, count: visible.filter((entry) => entry.section === section.id).length }))].map((chip) =>
          <button key={chip.id ?? "all"} type="button" aria-pressed={chosen === chip.id} onClick={() => update({ section: chip.id })}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              chosen === chip.id ? "border-transparent bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {chip.title}<span className="text-xs opacity-70">{chip.count}</span>
          </button>)}
      </nav>
      {filtered.length === 0 ? <p role="status" className="text-sm text-muted-foreground">No reports match “{query}”.</p> : null}
      {pinnedEntries.length ? <section aria-labelledby="pinned-reports" className="space-y-2"><h2 id="pinned-reports" className="text-sm font-medium text-muted-foreground">Pinned</h2><ul className={grid}>{pinnedEntries.map(card)}</ul></section> : null}
      {chosen || query ? (filtered.length ? <ul className={grid}>{filtered.map(card)}</ul> : null)
        : sections.map((section) => <section key={section.id} aria-labelledby={`reports-${section.id}`} className="space-y-2">
          <div className="flex items-baseline gap-2"><h2 id={`reports-${section.id}`} className="text-sm font-medium">{section.title}</h2><p className="text-xs text-muted-foreground">{section.description}</p></div>
          <ul className={grid}>{filtered.filter((entry) => entry.section === section.id).map(card)}</ul>
        </section>)}
    </>}
  </article>;
}
