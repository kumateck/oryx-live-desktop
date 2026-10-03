import { useSearchParams } from "react-router";
import { useAccess } from "@/shared/auth/use-access";
import { CollectionPicker } from "@/modules/collection-configurations/components/collection-picker";
import { CollectionPanel } from "@/modules/collection-configurations/components/collection-panel";
import { chooseCollection, collections } from "@/modules/collection-configurations/lib/collections";

export default function CollectionConfigurationsPage() {
  const { has } = useAccess();
  const [params, setParams] = useSearchParams();
  const visible = collections.filter((item) => has(item.permissions.view));
  const selected = chooseCollection(visible, params.get("collection"));
  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("collection", id);
    setParams(next);
  };

  return <section className="page-fill">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">SYSTEM SETTINGS</p><h1 className="text-xl font-semibold">Configuration collections</h1>
        <p className="text-sm text-muted-foreground">Manage the reference values used across Oryx.</p></div>
      <CollectionPicker definitions={visible} selected={selected?.id ?? ""} onSelect={select} />
    </header>
    {selected ? <CollectionPanel key={selected.id} definition={selected} />
      : <p role="alert" className="text-sm text-muted-foreground">This collection is unavailable or you do not have access. Choose an available collection.</p>}
  </section>;
}
