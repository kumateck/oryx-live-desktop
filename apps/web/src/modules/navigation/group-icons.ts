import {
  Boxes, ChartColumn, ClipboardCheck, Factory, FlaskConical, Headset, LayoutDashboard, Microscope, PackageCheck,
  Settings, ShieldCheck, ShoppingCart, Truck, Users, Wallet, Warehouse, type LucideIcon,
} from "lucide-react";
import type { NavigationGroupId } from "./catalog.generated";

// Every imported group needs an icon: a new Oryx Next group fails the type check until one is chosen.
export const groupIcons: Record<NavigationGroupId, LucideIcon> = {
  main: LayoutDashboard,
  "finance-and-cashflow": Wallet,
  procurement: ShoppingCart,
  logistics: Truck,
  "warehouse-management": Warehouse,
  "production-planning": Factory,
  "r-and-d": FlaskConical,
  "quality-control": Microscope,
  "quality-assurance": ShieldCheck,
  audit: ClipboardCheck,
  "fg-warehouse": PackageCheck,
  "inventory-and-stores": Boxes,
  "human-resource": Users,
  "it-support": Headset,
  "system-settings": Settings,
  reports: ChartColumn,
};
