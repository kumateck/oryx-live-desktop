import { CollectionWorkspace } from "@/modules/collection-configurations/workspace";
import { SettingsHeader } from "@/modules/settings-support/ui";
const audit = { module: "Settings", subModule: "Sites" };
export default function SitesPage() {
  return <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
    <SettingsHeader title="Sites" description="Maintain the sites used by operational workflows." />
    <CollectionWorkspace collectionId="sites" audit={audit} addLabel="Add site" />
  </section>;
}
