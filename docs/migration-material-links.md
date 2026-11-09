# Link missing department materials from a migration draft

On an Upload Center stock migration draft, choose **Link missing materials**.
The preview groups raw and packaging materials, with code, name, selected unit,
minimum, re-order and maximum levels. Select all eligible materials, a subset,
or one material, then choose **Link selected** for that group. Up to 1,000
materials can be confirmed in one request. Each group requires its own link key.

The backend re-resolves the entire draft, across sheets and pages, rather than
trusting previously saved blockers. It deduplicates resolved materials whose
blockers identify a missing department link. Excluded and unlimited materials
are not offered. The working Excel unit (including deliberate row corrections)
determines the storage unit. Conflicting, unsupported or absent units and
ambiguous/missing unit definitions are shown for correction, with selection
disabled. Existing, including retired, links are preserved.

| Excel unit family | Selected unit | Minimum | Re-order | Maximum |
| --- | --- | --- | --- | --- |
| PCS / Piece | Piece | 100 pieces | 1,000 pieces | 10,000 pieces |
| mg / g / kg | Milligram (mg) | 100,000,000 mg | 1,000,000,000 mg | 10,000,000,000 mg |
| ml / L | Milliliter (ml) | 100,000 ml | 1,000,000 ml | 10,000,000 ml |

Mass levels are equivalent to 100 / 1,000 / 10,000 kg; liquid levels are
equivalent to 100 / 1,000 / 10,000 L. The backend uses `UomConverter.Convert`;
the preview uses the shared quantity formatter to show both human-readable
levels and their stored mg/ml values. No density or unit family is guessed.

## API and safety

The companion backend adds GET and POST
`/api/v1/stock-migrations/{id}/material-links/{kind}` with stable operation IDs
`PreviewStockMigrationMaterialLinks` and `CreateStockMigrationMaterialLinks`.
The POST accepts selected preview snapshots, never arbitrary link settings.
It checks the material's stored kind, current units/defaults, draft state,
actor's current department and live grants inside a transaction. The existing
draft advisory lock serializes approval/discard/corrections; a short PostgreSQL
table lock on department links protects absence checks against concurrent link
writes, including the legacy upsert. This operation never updates an existing
link. A newly existing link is counted as preserved; another stale preview
change refuses the whole request with 409. Refresh the preview and review again.

The transaction creates only missing links and checks migration rows again.
Generated cache invalidation refreshes the migration, rows, comparison and link
previews. A refusal is displayed without automatically retrying a write.
No stock upload, approval, stock movement or write-off occurs. Requests retain
the Upload Center `Module: Settings` / `SubModule: Configurations` audit headers.
The backend's normal entity creation audit metadata is retained.

Permissions used: `CanViewOpeningBalances`, `CanCorrectOpeningBalances`,
`CanLinkRawMaterials`, `CanLinkPackagingMaterials`. There are no new keys,
role grants, schema migrations, routes or navigation entries. A user with no
active department must switch to the migration's department before linking.
Deploy the companion backend before activating this desktop feature.

## Verification and review

Desktop PR target: `development`. Backend PR target: `desmond-latest`; link the
companion PR and list the keys above when opening either PR. This work is local;
no push, deployment, live ERP writes or database migration is included.

Focused component tests cover bulk/single selection, each kind's permission,
correction denial, revocation, non-drafts, department mismatch, missing units,
empty results, audit headers and refused writes. PostgreSQL tests use a new
disposable database via `ORYX_MATERIAL_LINK_TEST_CONNECTION` (CREATE DATABASE
required), covering stored levels, deduplication, stale/conflicting units,
excluded rows, existing-link preservation, concurrent submissions, permission
revocation, department checks and unchanged stock.

The component preview was inspected with long names at 1366×768 and 1280×720,
plus 1024×576 and 853×480 scaling equivalents. The page has no horizontal
overflow; the dialog body scrolls while its header and footer remain visible.
These are browser fixture checks, not native Windows display-scaling or live
customer acceptance.
