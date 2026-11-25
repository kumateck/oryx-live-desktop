# Current packing styles on existing stock

Updating a product's packing style immediately re-expresses existing finished-goods balances using the current linked hierarchy. Transferred, received, on-site, reserved and available balances retain their exact base-unit quantity. Changing cartons or packs per shipper changes how those quantities are shown; it does not add, consume or remove stock.

For example, 3,500,005 tubes with 18 outer cartons per shipper and 20 tubes per carton display as **9,722 shippers, 4 loose cartons and 5 tubes**. The receipt form includes the leftover tubes, so accepting everything still sends exactly 3,500,005 base units.

The approved-product stock API calculates its counting dimensions from the current hierarchy. Note, batch and allocation-availability views use the same hierarchy. Both product and approved-product packing saves invalidate the mounted finished-goods queries after success. Failed saves preserve the existing counts. Existing historical receipt/allocation snapshots remain recorded; new allocations convert the current packs to base units and save their own conversion.

An invalid current hierarchy blocks conversion rather than falling back to a stale count. A legacy style with no hierarchy can retain its recorded units-per-pack until a hierarchy is supplied. This change does not repair incorrectly entered fill quantities or production yield.

Verification includes updated stock and note queries after both save endpoints, failed saves, unchanged base balances and snapshots, new allocation quantities and receipt of leftover base units. Permission keys and API shapes are unchanged; receipt submission rechecks its existing task permission immediately before mutation.
