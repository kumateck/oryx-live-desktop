import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigationPages, type NavigationGroup } from "../../modules/navigation/navigation-model";

const ownPages = [
  { label: "Account", path: "/settings/account", context: "Settings" },
  { label: "Appearance", path: "/settings/appearance", context: "Settings" },
];
const maxResults = 8;

export function AnimatedSearch({ groups }: { groups: readonly NavigationGroup[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const pages = useMemo(() => [...navigationPages(groups), ...ownPages], [groups]);
  const term = query.trim().toLowerCase();
  const results = term ? pages.filter((page) => `${page.label} ${page.context}`.toLowerCase().includes(term)).slice(0, maxResults) : [];
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const close = () => { setOpen(false); setQuery(""); };
  return <div className={`header-search ${open ? "open" : ""}`}>
    <Input ref={input} aria-label="Search pages" placeholder="Search pages" value={query} onChange={(event) => setQuery(event.target.value)}
      tabIndex={open ? 0 : -1} onKeyDown={(event) => { if (event.key === "Escape") close(); }} />
    <Button type="button" size="icon-sm" variant="ghost" aria-label={open ? "Close search" : "Open search"} aria-expanded={open}
      onClick={() => { if (open) close(); else setOpen(true); }}>{open ? <X /> : <Search />}</Button>
    {open && query.trim() && <div className="header-search-results" role="status">
      {results.length ? results.map((page) => <Link key={page.path} to={page.path} onClick={close}>{page.label}<small>{page.context}</small></Link>) : <span>No matching pages</span>}
    </div>}
  </div>;
}
