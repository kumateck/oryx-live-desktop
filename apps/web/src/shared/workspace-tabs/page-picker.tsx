import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { navigationPages, type NavigationGroup } from "@/modules/navigation/navigation-model";
import { useDesktopTab } from "./context";
import { internalDestination } from "./destinations";

export function WorkspacePagePicker({ groups }: { groups: readonly NavigationGroup[] }) {
  const tab = useDesktopTab();
  const [search, setSearch] = useState("");
  const pages = useMemo(() => [...navigationPages(groups), { label: "Account", path: "/settings/account", context: "Settings" },
    { label: "Appearance", path: "/settings/appearance", context: "Settings" }], [groups]);
  const words = search.toLowerCase().trim().split(/\s+/);
  const matches = pages.filter((page) => words.every((word) => `${page.label} ${page.context}`.toLowerCase().includes(word)));
  return <section className="workspace-page-picker" aria-label="Choose a page">
    <h1>Open a page</h1><p>Choose a page below or from the sidebar. Your other tabs stay open.</p>
    <div className="relative mt-4 mb-5"><Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input aria-label="Find a page" placeholder="Find a page…" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
    </div>
    <div className="workspace-page-choices">
      {matches.map((page) => <Button key={page.path} variant="ghost" className="workspace-page-choice" onClick={() => {
        const location = internalDestination(page.path, window.location.origin);
        if (location) tab?.workspace.navigate(location, page.label);
      }}><FileText aria-hidden="true" /><span><span>{page.label}</span><small>{page.context}</small></span></Button>)}
    </div>
    {!matches.length ? <p role="status">No matching pages. Try a different name.</p> : null}
  </section>;
}
