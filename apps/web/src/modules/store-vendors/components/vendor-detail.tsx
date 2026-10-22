import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { stores, type Vendor } from "../schemas/vendor";
export function VendorDetail({ row, onClose }: { row: Vendor; onClose: () => void }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row.name}</DialogTitle>
          <DialogDescription>Store vendor details</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <dt>Contact</dt>
            <dd>{row.contactPerson || "Not recorded"}</dd>
            <dt>Telephone</dt>
            <dd>{row.phone}</dd>
            <dt>Email</dt>
            <dd className="break-all">{row.email}</dd>
            <dt>Address</dt>
            <dd className="whitespace-pre-wrap">{row.address}</dd>
            <dt>Country</dt>
            <dd>{row.country?.name ?? row.countryId}</dd>
            <dt>Currency</dt>
            <dd>{row.currency?.name ?? row.currencyId}</dd>
          </dl>
          <h2 className="mt-5 font-semibold">Supplied items</h2>
          <ul className="mt-2 space-y-2">
            {row.items.map(({ item }) => (
              <li key={item.id}>
                {item.name} · {item.code || "No code"} · {stores[item.store]}
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
