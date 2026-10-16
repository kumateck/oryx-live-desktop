import { Building2, Package, Settings, User, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import type { ModuleManifest } from "@/modules/contract";
import { modules } from "@/modules/registry";
import { SettingsHeader } from "@/modules/settings-support/ui";
import { useAccess } from "@/shared/auth/use-access";

interface Group { title: string; icon: LucideIcon; roots: readonly string[] }
/** How the settings pages are grouped. A settings page not named here is listed under General settings. */
export const settingsGroups: readonly Group[] = [
  { title: "General settings", icon: Settings, roots: ["/settings/config", "/settings/code-settings", "/settings/questions", "/settings/templates", "/settings/appearance", "/settings/alert"] },
  { title: "User account", icon: User, roots: ["/settings/approvals", "/settings/signature", "/settings/change-password", "/settings/account"] },
  { title: "Inventory", icon: Package, roots: ["/settings/manufacturers", "/settings/suppliers", "/settings/warehouses", "/settings/locations", "/settings/racks", "/settings/shelves", "/settings/equipments", "/settings/qc-equipments", "/settings/uom", "/settings/sites", "/settings/upload-center"] },
  { title: "Organisation", icon: Building2, roots: ["/settings/departments", "/settings/working-days", "/settings/holidays", "/settings/shift-types", "/settings/shift-schedule", "/settings/shift-categories", "/settings/working-hours-policy"] },
];

/** The settings pages a user may open, in their groups; a group with nothing to open is left out. */
export function settingsSections(manifests: readonly ModuleManifest[], can: (manifest: ModuleManifest) => boolean) {
  const pages = manifests.filter((manifest) => manifest.root.startsWith("/settings/") && can(manifest));
  const grouped = new Set(settingsGroups.flatMap((group) => group.roots));
  return settingsGroups.map((group, index) => ({ title: group.title, icon: group.icon,
    pages: [...group.roots.flatMap((root) => pages.filter((page) => page.root === root)), ...(index === 0 ? pages.filter((page) => !grouped.has(page.root)) : [])] })).filter((group) => group.pages.length > 0);
}

export function SettingsHomePage() {
  const { can } = useAccess();
  const sections = settingsSections(modules, (manifest) => can(manifest.access));
  return <section className="min-w-0 space-y-5">
    <SettingsHeader title="System configuration" description="The setup pages you have access to." />
    {sections.length === 0 ? <p className="text-sm text-muted-foreground">You do not have access to any settings page.</p> : sections.map((section) => <section key={section.title} aria-label={section.title} className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold"><section.icon aria-hidden="true" className="size-4 text-muted-foreground" />{section.title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{section.pages.map((page) => <li key={page.id}><Link to={page.root} className="block rounded-lg border bg-card p-3 text-sm font-medium hover:border-primary focus-visible:outline-2">{page.label}</Link></li>)}</ul>
    </section>)}
  </section>;
}
