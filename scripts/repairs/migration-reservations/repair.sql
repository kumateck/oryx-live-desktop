-- psql entry point. Preview creates only temporary tables and rolls back.
\set ON_ERROR_STOP on
\if :{?apply}
\else
  \set apply false
\endif
\if :{?expected_token}
\else
  \set expected_token ''
\endif
\if :{?reason}
\else
  \set reason 'Reconcile unissued reservations after opening-stock replacement'
\endif
\if :apply
-- Take a fresh statement snapshot after all write locks have been acquired.
BEGIN ISOLATION LEVEL READ COMMITTED;
\else
BEGIN ISOLATION LEVEL REPEATABLE READ;
\endif
SET LOCAL search_path = public, pg_catalog;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SELECT set_config('oryx_reservation_repair.database', :'expected_database', true),
  set_config('oryx_reservation_repair.migration', :'migration_id', true),
  set_config('oryx_reservation_repair.email', :'actor_email', true),
  set_config('oryx_reservation_repair.apply', :'apply', true),
  set_config('oryx_reservation_repair.expected', :'expected_token', true),
  set_config('oryx_reservation_repair.reason', :'reason', true) \gset

DO $guard$ BEGIN
  IF current_database() <> current_setting('oryx_reservation_repair.database') THEN
    RAISE EXCEPTION 'Wrong database; expected_database must name this exact database';
  END IF;
  IF current_setting('oryx_reservation_repair.apply')::boolean THEN
    -- Existing writers do not share a repair advisory lock. Prevent changed rows
    -- and new reservations, issues, approvals or stock evidence during the repair.
    LOCK TABLE public."Requisitions", public."RequisitionItems", public."StockRequisitionIssues",
      public."ProductionScheduleProducts", public."ProductionSchedules", public."ProductionActivities",
      public."ProductionActivitySteps", public."Operations", public."MaterialReturnNotes", public."ProductionExtraPackings",
      public."FinalPackings", public."MaterialBatchReservedQuantities", public."MaterialBatches",
      public."Materials", public."ShelfMaterialBatches", public."WarehouseLocationShelves",
      public."WarehouseLocationRacks", public."WarehouseLocations", public."Warehouses",
      public."StockMigrations", public."StockMigrationLines", public."StockMigrationWriteOffs",
      public."BinCardInformation", public."MassMaterialBatchMovements", public."MaterialBatchEvents",
      public.users, public.roles, public.userroles, public.roleclaims, public."PermissionTypes"
      IN SHARE ROW EXCLUSIVE MODE;
  END IF;
END $guard$;

CREATE TEMP TABLE repair_target ON COMMIT DROP AS
SELECT m."Id" AS migration_id, m."DepartmentId" AS department_id, m."ApprovedAt" AS approved_at,
  m."FileName" AS file_name, u."Id" AS actor_id
FROM public."StockMigrations" m CROSS JOIN public.users u
WHERE m."Id" = current_setting('oryx_reservation_repair.migration')::uuid
  AND m."Status" = 1 AND m."Mode" = 0 AND m."DeletedAt" IS NULL AND m."ApprovedAt" IS NOT NULL
  AND lower(u."Email") = lower(current_setting('oryx_reservation_repair.email'))
  AND u."DepartmentId" = m."DepartmentId" AND NOT u."IsDisabled" AND u."DeletedAt" IS NULL;
DO $target$ BEGIN
  IF (SELECT count(*) FROM repair_target) <> 1 THEN
    RAISE EXCEPTION 'Require one approved replacement migration and one active operator in its department';
  END IF;
END $target$;

CREATE TEMP TABLE affected_requisitions ON COMMIT DROP AS
SELECT DISTINCT r."Id" AS id
FROM public."Requisitions" r
JOIN public."RequisitionItems" i ON i."RequisitionId" = r."Id" AND i."DeletedAt" IS NULL
JOIN public."MaterialBatchReservedQuantities" q ON q."ProductionScheduleProductId" = r."ProductionScheduleProductId" AND q."DeletedAt" IS NULL
JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId" AND b."MaterialId" = i."MaterialId"
JOIN public."StockMigrationWriteOffs" off ON off."MaterialBatchId" = b."Id"
JOIN public."StockMigrations" old_replacement ON old_replacement."Id" = off."StockMigrationId"
CROSS JOIN repair_target t
WHERE r."DepartmentId" = t.department_id AND r."DeletedAt" IS NULL
  AND r."RequisitionType" = 0 AND r."Status" IN (0, 1, 2) AND b."Status" = 7
  AND old_replacement."Status" = 1 AND old_replacement."Mode" = 0
  AND old_replacement."DepartmentId" = t.department_id AND old_replacement."ApprovedAt" <= t.approved_at;

CREATE TEMP TABLE repair_problems (problem text NOT NULL) ON COMMIT DROP;
INSERT INTO repair_problems
SELECT r."Code" || ': requisition has issue evidence, an approval/quantity problem, or closed production'
FROM public."Requisitions" r JOIN affected_requisitions a ON a.id = r."Id"
LEFT JOIN public."ProductionScheduleProducts" p ON p."Id" = r."ProductionScheduleProductId"
LEFT JOIN public."ProductionSchedules" s ON s."Id" = p."ProductionScheduleId"
WHERE NOT r."Approved" OR p."Id" IS NULL OR p."Cancelled"
  OR s."Id" IS NULL OR s."DeletedAt" IS NOT NULL OR s."Status" IN (2, 4)
  OR (SELECT count(*) FROM public."ProductionActivities" run WHERE run."ProductionScheduleProductId" = p."Id"
      AND run."DeletedAt" IS NULL AND run."Status" NOT IN (2, 4) AND run."CompletedAt" IS NULL) <> 1
  OR EXISTS (SELECT 1 FROM public."StockRequisitionIssues" issue WHERE issue."RequisitionId" = r."Id")
  OR EXISTS (SELECT 1 FROM public."BinCardInformation" card WHERE card."RequisitionId" = r."Id" AND card."QuantityIssued" > 0)
  OR EXISTS (SELECT 1 FROM public."RequisitionItems" i WHERE i."RequisitionId" = r."Id"
      AND (i."Status" = 3 OR i."QuantityReceived" <> 0 OR i."DeletedAt" IS NOT NULL OR i."Quantity" <= 0))
  OR EXISTS (SELECT 1 FROM public."MaterialReturnNotes" n WHERE n."ProductionScheduleProductId" = p."Id")
  OR EXISTS (SELECT 1 FROM public."ProductionExtraPackings" n WHERE n."ProductionScheduleProductId" = p."Id")
  OR EXISTS (SELECT 1 FROM public."FinalPackings" n WHERE n."ProductionScheduleProductId" = p."Id");

CREATE TEMP TABLE repair_items ON COMMIT DROP AS
SELECT r."Id" AS requisition_id, r."Code" AS code, i."Id" AS item_id, i."MaterialId" AS material_id,
  i."Quantity" AS approved_quantity, i."UoMId" AS unit_id, r."ProductionScheduleProductId" AS production_id,
  m."Kind" AS kind, m."Code" AS material_code
FROM affected_requisitions a JOIN public."Requisitions" r ON r."Id" = a.id
JOIN public."RequisitionItems" i ON i."RequisitionId" = r."Id" AND i."DeletedAt" IS NULL
JOIN public."Materials" m ON m."Id" = i."MaterialId";
INSERT INTO repair_problems
SELECT i.code || '/' || i.material_code || ': reservations do not match one approved line and unit'
FROM repair_items i
WHERE (SELECT count(*) FROM repair_items j WHERE j.requisition_id = i.requisition_id AND j.material_id = i.material_id) <> 1
  OR i.unit_id IS NULL OR i.kind NOT IN (0, 1)
  OR i.approved_quantity <> coalesce((SELECT sum(q."Quantity") FROM public."MaterialBatchReservedQuantities" q
    JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId"
    WHERE q."ProductionScheduleProductId" = i.production_id AND b."MaterialId" = i.material_id AND q."DeletedAt" IS NULL), 0)
  OR EXISTS (SELECT 1 FROM public."MaterialBatchReservedQuantities" q JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId"
    WHERE q."ProductionScheduleProductId" = i.production_id AND b."MaterialId" = i.material_id AND q."DeletedAt" IS NULL
      AND (q."Quantity" <= 0 OR q."UoMId" <> i.unit_id OR b."UoMId" <> i.unit_id OR b."DeletedAt" IS NOT NULL));
INSERT INTO repair_problems
SELECT DISTINCT i.code || ': the material consumption step has started; reconcile its production records separately'
FROM repair_items i JOIN public."ProductionActivities" a ON a."ProductionScheduleProductId" = i.production_id AND a."DeletedAt" IS NULL
JOIN public."ProductionActivitySteps" step ON step."ProductionActivityId" = a."Id" AND step."DeletedAt" IS NULL
JOIN public."Operations" op ON op."Id" = step."OperationId"
WHERE (i.kind = 0 AND op."Name" LIKE 'Product Preparation%' OR i.kind = 1 AND op."Name" LIKE 'Final Packing%')
  AND (step."StartedAt" IS NOT NULL OR step."CompletedAt" IS NOT NULL OR step."Status" <> 0);

CREATE TEMP TABLE stale_reservations ON COMMIT DROP AS
SELECT i.*, q."Id" AS reservation_id, q."MaterialBatchId" AS old_batch_id,
  q."WarehouseLocationShelfId" AS old_shelf_id, q."WarehouseId" AS production_warehouse_id, q."Quantity" AS quantity,
  to_jsonb(q) AS before_row
FROM repair_items i JOIN public."MaterialBatchReservedQuantities" q
  ON q."ProductionScheduleProductId" = i.production_id AND q."DeletedAt" IS NULL
JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId" AND b."MaterialId" = i.material_id
WHERE b."Status" = 7 AND EXISTS (SELECT 1 FROM public."StockMigrationWriteOffs" off
  JOIN public."StockMigrations" sm ON sm."Id" = off."StockMigrationId" CROSS JOIN repair_target t
  WHERE off."MaterialBatchId" = b."Id" AND sm."DepartmentId" = t.department_id
    AND sm."Status" = 1 AND sm."Mode" = 0 AND sm."ApprovedAt" <= t.approved_at);
INSERT INTO repair_problems
SELECT 'A reservation belongs to multiple outstanding requisition lines'
WHERE EXISTS (SELECT 1 FROM stale_reservations GROUP BY reservation_id HAVING count(*) <> 1);
INSERT INTO repair_problems
SELECT s.code || ': production warehouse does not belong to the selected department'
FROM stale_reservations s CROSS JOIN repair_target t
WHERE NOT EXISTS (SELECT 1 FROM public."Warehouses" w WHERE w."Id" = s.production_warehouse_id
  AND w."Type" = 3 AND w."DepartmentId" = t.department_id AND w."DeletedAt" IS NULL);

-- Only a unique, released lot from the explicitly selected replacement can be
-- chosen automatically. Multiple lots/shelves need a separately reviewed allocation.
CREATE TEMP TABLE replacement_candidates ON COMMIT DROP AS
SELECT DISTINCT s.reservation_id, b."Id" AS new_batch_id, sb."Id" AS shelf_stock_id,
  sb."WarehouseLocationShelfId" AS new_shelf_id, sb."Quantity" AS shelf_quantity,
  b."TotalQuantity" AS total_quantity, b."ConsumedQuantity" AS consumed_quantity,
  b."ExpiryDate" AS expiry_date, b."RetestDate" AS retest_date, b."Status" AS batch_status,
  w."Id" AS source_warehouse_id
FROM stale_reservations s CROSS JOIN repair_target t
JOIN public."StockMigrationLines" line ON line."StockMigrationId" = t.migration_id AND line."DeletedAt" IS NULL
JOIN public."MaterialBatches" b ON b."Id" = line."ImportedBatchId" AND b."MaterialId" = s.material_id
JOIN public."ShelfMaterialBatches" sb ON sb."MaterialBatchId" = b."Id"
JOIN public."WarehouseLocationShelves" sh ON sh."Id" = sb."WarehouseLocationShelfId"
JOIN public."WarehouseLocationRacks" rk ON rk."Id" = sh."WarehouseLocationRackId"
JOIN public."WarehouseLocations" loc ON loc."Id" = rk."WarehouseLocationId"
JOIN public."Warehouses" w ON w."Id" = loc."WarehouseId"
JOIN public."Materials" m ON m."Id" = b."MaterialId"
WHERE b."Status" = 3 AND b."DeletedAt" IS NULL AND m."DeletedAt" IS NULL
  AND b."UoMId" = s.unit_id AND sb."UoMId" = s.unit_id AND sb."Quantity" > 0
  AND sb."DeletedAt" IS NULL AND sh."DeletedAt" IS NULL AND rk."DeletedAt" IS NULL
  AND loc."DeletedAt" IS NULL AND w."DeletedAt" IS NULL AND w."DepartmentId" = t.department_id
  AND w."Type" = CASE WHEN s.kind = 0 THEN 0 ELSE 1 END
  AND (CASE WHEN s.kind = 0 AND NOT coalesce(b."ExpiryDate" > now(), false)
      THEN coalesce(b."RetestDate", b."ExpiryDate") ELSE b."ExpiryDate" END IS NULL
    OR CASE WHEN s.kind = 0 AND NOT coalesce(b."ExpiryDate" > now(), false)
      THEN coalesce(b."RetestDate", b."ExpiryDate") ELSE b."ExpiryDate" END = '-infinity'::timestamptz
    OR CASE WHEN s.kind = 0 AND NOT coalesce(b."ExpiryDate" > now(), false)
      THEN coalesce(b."RetestDate", b."ExpiryDate") ELSE b."ExpiryDate" END > now());
INSERT INTO repair_problems
SELECT s.code || '/' || s.material_code || ': expected one eligible replacement lot and shelf; found ' || count(c.reservation_id)
FROM stale_reservations s LEFT JOIN replacement_candidates c ON c.reservation_id = s.reservation_id
GROUP BY s.reservation_id, s.code, s.material_code HAVING count(c.reservation_id) <> 1;

CREATE TEMP TABLE repair_bindings ON COMMIT DROP AS
SELECT s.*, c.new_batch_id, c.shelf_stock_id, c.new_shelf_id, c.shelf_quantity,
  c.total_quantity, c.consumed_quantity, c.expiry_date, c.retest_date, c.batch_status, c.source_warehouse_id
FROM stale_reservations s JOIN replacement_candidates c USING (reservation_id);
CREATE TEMP TABLE capacity ON COMMIT DROP AS
SELECT c.new_batch_id, c.shelf_stock_id, min(c.shelf_quantity) AS shelf_quantity,
  min(c.total_quantity) AS total_quantity, min(c.consumed_quantity) AS consumed_quantity,
  sum(c.quantity) AS required_quantity,
  coalesce((SELECT sum(q."Quantity") FROM public."MaterialBatchReservedQuantities" q
    WHERE q."MaterialBatchId" = c.new_batch_id AND q."DeletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM public."Requisitions" r JOIN public."RequisitionItems" i ON i."RequisitionId" = r."Id"
        JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId"
        WHERE r."ProductionScheduleProductId" = q."ProductionScheduleProductId" AND i."MaterialId" = b."MaterialId"
          AND r."RequisitionType" = 0 AND r."Status" = 3 AND r."DeletedAt" IS NULL)), 0) AS pending_reserved,
  coalesce((SELECT sum(q."Quantity") FROM public."MaterialBatchReservedQuantities" q
    WHERE q."MaterialBatchId" = c.new_batch_id AND q."DeletedAt" IS NULL), 0) AS all_reserved
FROM repair_bindings c GROUP BY c.new_batch_id, c.shelf_stock_id;
INSERT INTO repair_problems
SELECT 'Replacement lot ' || new_batch_id || ': insufficient uncommitted stock for all outstanding requisitions'
FROM capacity WHERE required_quantity > least(shelf_quantity - pending_reserved, total_quantity - consumed_quantity - all_reserved)
  OR consumed_quantity < 0 OR all_reserved < 0 OR pending_reserved < 0;
INSERT INTO repair_problems
SELECT DISTINCT b.material_code || ': source shelf stock does not reconcile with bin-card history'
FROM repair_bindings b
WHERE coalesce((SELECT sum(card."QuantityReceived" - card."QuantityIssued") FROM public."BinCardInformation" card
  JOIN public."MaterialBatches" lot ON lot."Id" = card."MaterialBatchId"
  WHERE card."WarehouseId" = b.source_warehouse_id AND lot."MaterialId" = b.material_id), 0)
  <> coalesce((SELECT sum(sb."Quantity") FROM public."ShelfMaterialBatches" sb
    JOIN public."MaterialBatches" lot ON lot."Id" = sb."MaterialBatchId"
    JOIN public."WarehouseLocationShelves" sh ON sh."Id" = sb."WarehouseLocationShelfId"
    JOIN public."WarehouseLocationRacks" rk ON rk."Id" = sh."WarehouseLocationRackId"
    JOIN public."WarehouseLocations" loc ON loc."Id" = rk."WarehouseLocationId"
    WHERE loc."WarehouseId" = b.source_warehouse_id AND lot."MaterialId" = b.material_id AND sb."DeletedAt" IS NULL), 0);

INSERT INTO repair_problems
SELECT DISTINCT 'Operator lacks current ' || CASE WHEN s.kind = 0 THEN 'CanIssueRawMaterialRequisitions' ELSE 'CanIssuePackagingMaterialRequisitions' END
FROM stale_reservations s CROSS JOIN repair_target t
WHERE NOT EXISTS (SELECT 1 FROM public.userroles ur JOIN public.roles role ON role."Id" = ur."RoleId" AND role."DeletedAt" IS NULL
  JOIN public.roleclaims rc ON rc."RoleId" = role."Id"
  JOIN public."PermissionTypes" pt ON pt."RoleClaimId" = rc."Id" AND pt."Key" = rc."ClaimValue" AND pt."Type" IS NOT NULL AND pt."Type" <> ''
  WHERE ur."UserId" = t.actor_id AND rc."ClaimType" = 'permission'
    AND rc."ClaimValue" = CASE WHEN s.kind = 0 THEN 'CanIssueRawMaterialRequisitions' ELSE 'CanIssuePackagingMaterialRequisitions' END);

CREATE TEMP TABLE repair_report ON COMMIT DROP AS
SELECT jsonb_build_object('database', current_database(), 'migrationId', t.migration_id, 'migrationFile', t.file_name,
  'departmentId', t.department_id, 'actorId', t.actor_id, 'actorEmail', current_setting('oryx_reservation_repair.email'),
  'requisitions', coalesce((SELECT jsonb_agg(jsonb_build_object('id', r."Id", 'code', r."Code", 'updatedAt', r."UpdatedAt",
    'approved', r."Approved", 'status', r."Status", 'productionId', r."ProductionScheduleProductId") ORDER BY r."Id")
    FROM affected_requisitions a JOIN public."Requisitions" r ON r."Id" = a.id), '[]'),
  'items', coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.item_id) FROM repair_items i), '[]'),
  'bindings', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.reservation_id, b.new_batch_id, b.shelf_stock_id) FROM repair_bindings b), '[]'),
  'capacity', coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.new_batch_id, c.shelf_stock_id) FROM capacity c), '[]'),
  'problems', coalesce((SELECT jsonb_agg(problem ORDER BY problem) FROM repair_problems), '[]')) AS report
FROM repair_target t;
ALTER TABLE repair_report ADD COLUMN token text;
UPDATE repair_report SET token = encode(sha256(convert_to(report::text, 'UTF8')), 'hex');
SELECT report || jsonb_build_object('previewToken', token, 'mode', 'preview') FROM repair_report;

\if :apply
DO $apply$
DECLARE
  snapshot jsonb; preview_token text; operator_id uuid; changed integer; expected integer;
  after_rows jsonb; repair_id uuid := gen_random_uuid();
BEGIN
  SELECT report, token INTO snapshot, preview_token FROM repair_report;
  SELECT actor_id INTO operator_id FROM repair_target;
  IF current_setting('oryx_reservation_repair.expected') <> preview_token THEN
    RAISE EXCEPTION 'Preview changed or expected_token missing. Run preview again and review it';
  END IF;
  IF EXISTS (SELECT 1 FROM repair_problems) THEN RAISE EXCEPTION 'Repair is blocked; resolve every preview problem'; END IF;
  SELECT count(*) INTO expected FROM repair_bindings;
  IF expected = 0 THEN RAISE EXCEPTION 'No affected reservations remain; nothing was changed'; END IF;
  IF length(trim(current_setting('oryx_reservation_repair.reason'))) NOT BETWEEN 10 AND 1000 THEN
    RAISE EXCEPTION 'A 10-1000 character repair reason is required';
  END IF;
  UPDATE public."MaterialBatchReservedQuantities" q SET "MaterialBatchId" = b.new_batch_id,
    "WarehouseLocationShelfId" = b.new_shelf_id, "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = operator_id
  FROM repair_bindings b WHERE q."Id" = b.reservation_id AND to_jsonb(q) = b.before_row;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> expected THEN RAISE EXCEPTION 'A reservation changed during repair'; END IF;
  IF EXISTS (SELECT 1 FROM repair_items i WHERE i.approved_quantity <> (
    SELECT sum(q."Quantity") FROM public."MaterialBatchReservedQuantities" q
    JOIN public."MaterialBatches" b ON b."Id" = q."MaterialBatchId"
    WHERE q."ProductionScheduleProductId" = i.production_id AND b."MaterialId" = i.material_id AND q."DeletedAt" IS NULL)) THEN
    RAISE EXCEPTION 'Post-repair approved quantities do not reconcile';
  END IF;
  SELECT jsonb_agg(to_jsonb(q) ORDER BY q."Id") INTO after_rows
  FROM public."MaterialBatchReservedQuantities" q JOIN repair_bindings b ON b.reservation_id = q."Id";

  CREATE TABLE IF NOT EXISTS public."_MigrationReservationRepairs" (
    "Id" uuid PRIMARY KEY, "RepairedAt" timestamptz NOT NULL, "DatabaseUser" text NOT NULL,
    "ActorId" uuid NOT NULL, "Reason" text NOT NULL, "PreviewToken" text NOT NULL UNIQUE,
    "Before" jsonb NOT NULL, "After" jsonb NOT NULL
  );
  INSERT INTO public."_MigrationReservationRepairs" VALUES (repair_id, transaction_timestamp(), current_user,
    operator_id, trim(current_setting('oryx_reservation_repair.reason')), preview_token, snapshot, after_rows);
  RAISE NOTICE 'Repair % rebound % reservations. No stock quantities, approvals or issue records were changed.', repair_id, changed;
END $apply$;
CREATE OR REPLACE FUNCTION public.oryx_protect_migration_reservation_repairs() RETURNS trigger LANGUAGE plpgsql AS $protect$
BEGIN RAISE EXCEPTION 'Migration reservation repair evidence is immutable'; END $protect$;
DROP TRIGGER IF EXISTS protect_migration_reservation_repairs ON public."_MigrationReservationRepairs";
CREATE TRIGGER protect_migration_reservation_repairs BEFORE UPDATE OR DELETE OR TRUNCATE
  ON public."_MigrationReservationRepairs" FOR EACH STATEMENT EXECUTE FUNCTION public.oryx_protect_migration_reservation_repairs();
SELECT jsonb_build_object('mode', 'applied', 'repair', to_jsonb(a)) FROM public."_MigrationReservationRepairs" a
WHERE a."PreviewToken" = (SELECT token FROM repair_report);
COMMIT;
\else
ROLLBACK;
\endif
