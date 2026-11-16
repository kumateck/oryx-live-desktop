import { Boxes, ClipboardList, Factory, FileCheck2, PackageCheck, ShoppingCart, Store, Users, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { ReportSectionId } from "../lib/report-directory";

const icons: Record<ReportSectionId, LucideIcon> = {
  suppliers: Factory, purchasing: ShoppingCart, materials: Boxes, production: ClipboardList, products: PackageCheck, specifications: FileCheck2, stores: Store, people: Users,
};
/** Each group keeps one quiet tint so the hub can be scanned by colour as well as by name. */
const tints: Record<ReportSectionId, string> = {
  suppliers: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  purchasing: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  materials: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  production: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  products: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  specifications: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  stores: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  people: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export function ReportSectionIcon({ section, className }: { section: ReportSectionId; className?: string }) {
  const Icon = icons[section];
  return <span aria-hidden="true" className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tints[section], className)}><Icon className="size-[18px]" /></span>;
}
