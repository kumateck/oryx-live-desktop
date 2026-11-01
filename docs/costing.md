# Finance costing

Costing is a Finance module at `/finance/costing` (sidebar: Finance & Cashflow → Costing). It holds what each product is priced at, and in which currency. It replaces the Pricing tab of the customer workspace.

| Page | Route | Shows |
| --- | --- | --- |
| List prices | `/finance/costing` | Every product's current list price, the currency it is priced in, its unit and since when. "Set price" records a new price in a chosen currency and shows the price history. |
| Customer agreements | `/finance/costing/agreements` | Agreements across all customers, with `?customer=<id>` to show one customer and `?state=active` for those in effect today. "Add agreement" opens the editor. |
| Agreement | `/finance/costing/agreements/:id` | Price, currency, customer, packing style, period and notes, with Edit and Remove. |

All three need `ManageCosting`, granted under Finance → Costing on the role permissions page (`modules/costing/manifest.ts`, the sidebar entry, and every costing and pricing-agreement endpoint on the backend). The backend migration gave it to every role that had `ManageCustomerContracts`. Agreements are still saved through the customer endpoints; there is no approval step for them.

The permissions page lists modules as the backend sends them, so the new Finance section (payments, cashflow reports and costing) appears there with no desktop change.

## Currency

- An agreement and a list price each record the currency they are in. The editors require it ("Priced in").
- Prices are never converted. A price without a currency is shown as such (`10.00 · no currency`) rather than borrowing another currency.
- Quotations: when the customer has a preferred currency and a product's price on record is in another currency, the server refuses the price and the quotation line shows its reason; the user enters the price or adds an agreement in the customer's currency. A customer with no preferred currency gets a quotation in the one currency its prices are in.
- FG dispatch proforma and invoice lines take the agreement's currency, or else the list price's own currency (previously the customer's), and total per currency.
- The invoiced products report export includes a Currency column.

## Moved from the product forms

Products no longer ask for a price when created or edited; the edit form leaves the list price as it is. The product detail shows the list price read-only with a link to Costing. A product without a list price shows "Not priced" in Costing, and a quotation for it needs an agreement or a typed unit price.

## Moved from the customer workspace

The customer workspace no longer has a Pricing tab. For users with `ManageCosting`, its header links to "Pricing agreements" (the customer's agreements in Costing), and a saved link to `?tab=pricing` redirects there. The shared form dialog the pricing editor used moved to `shared/forms/form-dialog.tsx`.

The backend side, including the migration that backfills existing list prices to the base currency, is described in the backend's `docs/finance-costing.md`.
