import { Outlet } from "react-router";
import { QaProductWorkspace } from "@/modules/products/hooks/use-product-workspace";
export default function QaProductsLayout() { return <QaProductWorkspace><Outlet /></QaProductWorkspace>; }
