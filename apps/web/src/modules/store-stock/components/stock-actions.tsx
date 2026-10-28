import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, TriangleAlert } from "lucide-react";
import { TableMenu } from "@/shared/actions";
import { stockLink, stockRule } from "@/shared/inventory/stores";
import type { StockReceipt } from "../schemas/stock";
import { DamageKind } from "../schemas/stock";
const Damage = lazy(() => import("./damage-dialog").then((m) => ({ default: m.DamageDialog })));
export function StockActions({ row }: { row: StockReceipt }) {
  const navigate = useNavigate();
  const [kind, setKind] = useState<DamageKind | null>(null);
  return (
    <>
      <TableMenu
        label={`Stock actions for ${row.item.name}`}
        items={[
          {
            id: "ledger",
            label: "View transactions",
            icon: Eye,
            require: stockRule(row.item.store, "available"),
            onSelect: () =>
              navigate(`${stockLink(row.item.store, "available", `/${encodeURIComponent(row.item.code)}/item-transactions`)}&itemId=${row.itemId}`),
          },
          {
            id: "damage",
            label: "Report damaged stock",
            icon: TriangleAlert,
            require: stockRule(row.item.store, "damage"),
            onSelect: () => setKind(DamageKind.Damaged),
          },
          {
            id: "missing",
            label: "Report missing stock",
            icon: TriangleAlert,
            require: stockRule(row.item.store, "damage"),
            onSelect: () => setKind(DamageKind.Missing),
          },
        ]}
      />
      {kind !== null ? (
        <Suspense fallback={<p role="status">Loading stock report…</p>}>
          <Damage receipt={row} kind={kind} close={() => setKind(null)} />
        </Suspense>
      ) : null}
    </>
  );
}
