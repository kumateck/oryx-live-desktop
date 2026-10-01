import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useHeaderSearch } from "@/shared/search/use-header-search";
import { navigationPages, type NavigationGroup } from "../../modules/navigation/navigation-model";

const ownPages = [
  { label: "Account", path: "/settings/account", context: "Settings" },
  { label: "Appearance", path: "/settings/appearance", context: "Settings" },
];
const maxPages = 6;

/**
 * One search box for the workspace. On a list page it filters that page's records; it also offers
 * matching pages to jump to. Ctrl/Cmd+K or "/" focuses it, Escape clears it.
 */
export function AnimatedSearch({ groups }: { groups: readonly NavigationGroup[] }) {
  const search = useHeaderSearch();
  const pages = useMemo(() => [...navigationPages(groups), ...ownPages], [groups]);
  const term = search.draft.trim().toLowerCase();
  const matches = term ? pages.filter((page) => `${page.label} ${page.context}`.toLowerCase().includes(term)).slice(0, maxPages) : [];
  const label = search.target ? `Search ${search.target.label}` : "Search pages";
  return <div className={`header-search ${search.open ? "open" : ""}`} role="search">
    <Input ref={search.input} type="search" aria-label={label} placeholder={`${label} (Ctrl K)`} value={search.draft}
      onChange={(event) => search.setDraft(event.target.value)} tabIndex={search.open ? 0 : -1}
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); if (search.draft) search.clear(); else search.hide(); } }} />
    {search.open && search.pending ? <span role="status" aria-label="Searching" className="flex-none px-1 text-muted-foreground"><Spinner /></span> : null}
    <Button type="button" size="icon-sm" variant="ghost" aria-label={search.open ? "Close search" : "Open search"} aria-expanded={search.open}
      onClick={() => { if (search.open) search.hide(); else search.show(); }}>{search.open ? <X /> : <Search />}</Button>
    {search.open && term && (matches.length > 0 || !search.target) ? <div className="header-search-results">
      {search.target ? <span className="header-search-hint">Filtering {search.target.label} on this page</span> : null}
      {matches.length ? <><span className="header-search-hint">Go to page</span>
        {matches.map((page) => <Link key={page.path} to={page.path} onClick={search.hide}>{page.label}<small>{page.context}</small></Link>)}</>
        : <span>No matching pages</span>}
    </div> : null}
  </div>;
}
