\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SELECT set_config('oryx_repair.expected_database', :'expected_database', true) AS target_database \gset
DO $$ BEGIN
 IF current_database() <> current_setting('oryx_repair.expected_database') THEN RAISE EXCEPTION 'Wrong database'; END IF;
END $$;
LOCK TABLE "Materials", "MaterialBatches", "StockMigrationLines" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE repair_target(number text PRIMARY KEY, quantity numeric) ON COMMIT DROP;
INSERT INTO repair_target VALUES ('GLB-M/028/0620',100000000),('GLB-M/033/08/21',50000000);
CREATE TEMP TABLE repair_materials ON COMMIT DROP AS
 SELECT "Id" AS id,"Code" AS code,"Name" AS name FROM "Materials" WHERE "Code" IN ('RMG001','RMG002') AND "DeletedAt" IS NULL AND "Kind"=0;
DO $$ BEGIN
 IF (SELECT count(*) FROM repair_materials)<>2 OR (SELECT count(*) FROM repair_materials WHERE code='RMG001' AND name ILIKE '%Glibenclamide%')<>1
 OR (SELECT count(*) FROM repair_materials WHERE code='RMG002' AND name ILIKE '%Griseofulvin%')<>1 THEN RAISE EXCEPTION 'Material codes or identities differ; stop and review'; END IF;
END $$;
CREATE TEMP TABLE repair_batches ON COMMIT DROP AS
 SELECT b."Id" AS id,b."MaterialId" AS old_material,t.quantity,b."BatchNumber" AS number FROM "MaterialBatches" b
 JOIN repair_target t ON t.number=b."BatchNumber" WHERE b."MaterialId" IN (SELECT id FROM repair_materials) AND b."DeletedAt" IS NULL;
DO $guards$
DECLARE dependency record; used bigint;
BEGIN
 IF (SELECT count(*) FROM repair_batches)<>2 OR EXISTS(SELECT number FROM repair_batches GROUP BY number HAVING count(*)<>1) THEN RAISE EXCEPTION 'Expected exactly one batch for each of the two batch numbers'; END IF;
 IF EXISTS(SELECT 1 FROM "MaterialBatches" b JOIN repair_batches r ON r.id=b."Id" JOIN "UnitOfMeasures" u ON u."Id"=b."UoMId"
  WHERE b."TotalQuantity"<>r.quantity OR lower(u."Symbol")<>'mg' OR b."ConsumedQuantity"<>0 OR b."SampledQuantity"<>0 OR b."QuantityDistributed"<>0 OR b."Status"<>3
   OR b."GrnId" IS NOT NULL OR b."StockTransferId" IS NOT NULL OR b."ChecklistId" IS NOT NULL) THEN RAISE EXCEPTION 'Batch stock, unit, status or intake provenance changed'; END IF;
 IF EXISTS(SELECT 1 FROM repair_batches r WHERE (SELECT count(*) FROM "StockMigrationLines" l WHERE l."ImportedBatchId"=r.id AND l."SheetMaterialCode"='RMG001'
  AND l."SheetMaterialName" ILIKE '%Glibenclamide%' AND l."Quantity"=r.quantity AND l."ResolvedMaterialId"=r.old_material)<>1) THEN RAISE EXCEPTION 'Opening migration provenance differs'; END IF;
 -- Lock every actual FK dependency while checking usage, including tables added after this script was authored.
 FOR dependency IN SELECT c.conrelid::regclass AS relation,a.attname AS column_name FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
  WHERE c.contype='f' AND c.confrelid='"MaterialBatches"'::regclass LOOP
  EXECUTE format('LOCK TABLE %s IN SHARE MODE',dependency.relation);
  IF dependency.relation::text IN ('"ShelfMaterialBatches"','"StockMigrationLines"','"BinCardInformation"','"MassMaterialBatchMovements"') THEN CONTINUE; END IF;
  EXECUTE format('SELECT count(*) FROM %s WHERE %I IN (SELECT id FROM repair_batches)',dependency.relation,dependency.column_name) INTO used;
  IF used<>0 THEN RAISE EXCEPTION 'Batch usage in % prevents automatic material reassignment',dependency.relation; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM repair_batches r WHERE (SELECT count(*) FROM "ShelfMaterialBatches" s WHERE s."MaterialBatchId"=r.id AND s."DeletedAt" IS NULL)<>1
  OR (SELECT sum(s."Quantity") FROM "ShelfMaterialBatches" s WHERE s."MaterialBatchId"=r.id AND s."DeletedAt" IS NULL)<>r.quantity) THEN RAISE EXCEPTION 'Shelf stock differs'; END IF;
 IF EXISTS(SELECT 1 FROM "BinCardInformation" l WHERE l."MaterialBatchId" IN (SELECT id FROM repair_batches)
  AND (l."QuantityIssued"<>0 OR l."RequisitionId" IS NOT NULL OR l."Description" NOT LIKE 'Stock migration %opening stock%')) THEN RAISE EXCEPTION 'Non-opening ledger evidence prevents reassignment'; END IF;
 IF EXISTS(SELECT 1 FROM "MassMaterialBatchMovements" m WHERE m."BatchId" IN (SELECT id FROM repair_batches)
  AND (m."MovementType"<>0 OR m."FromWarehouseId" IS NOT NULL OR m."DeletedAt" IS NOT NULL)) THEN RAISE EXCEPTION 'Non-opening movement evidence prevents reassignment'; END IF;
END $guards$;
CREATE TEMP TABLE repair_before ON COMMIT DROP AS SELECT jsonb_build_object(
 'batches',(SELECT jsonb_agg(to_jsonb(b) ORDER BY b."Id") FROM "MaterialBatches" b WHERE "Id" IN (SELECT id FROM repair_batches)),
 'migrationLines',(SELECT jsonb_agg(to_jsonb(l) ORDER BY l."Id") FROM "StockMigrationLines" l WHERE "ImportedBatchId" IN (SELECT id FROM repair_batches)),
 'shelves',(SELECT jsonb_agg(to_jsonb(s) ORDER BY s."Id") FROM "ShelfMaterialBatches" s WHERE "MaterialBatchId" IN (SELECT id FROM repair_batches)),
 'remainingRmg002',(SELECT jsonb_agg(to_jsonb(b) ORDER BY b."Id") FROM "MaterialBatches" b WHERE b."MaterialId"=(SELECT id FROM repair_materials WHERE code='RMG002') AND b."Id" NOT IN (SELECT id FROM repair_batches))) AS evidence;
UPDATE "MaterialBatches" b SET "MaterialId"=m.id,"UpdatedAt"=now() FROM repair_materials m
 WHERE m.code='RMG001' AND b."Id" IN (SELECT id FROM repair_batches) AND b."MaterialId"<>m.id;
-- Keep source spreadsheet evidence intact. Correct only the resolved foreign key used by the posted opening line.
UPDATE "StockMigrationLines" l SET "ResolvedMaterialId"=m.id,"UpdatedAt"=now() FROM repair_materials m
 WHERE m.code='RMG001' AND l."ImportedBatchId" IN (SELECT id FROM repair_batches) AND l."ResolvedMaterialId"<>m.id;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM "MaterialBatches" b JOIN repair_batches r ON r.id=b."Id" WHERE b."MaterialId"<>(SELECT id FROM repair_materials WHERE code='RMG001')) THEN RAISE EXCEPTION 'Post-repair identity verification failed'; END IF;
 IF (SELECT evidence->'shelves' FROM repair_before) IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(s) ORDER BY s."Id") FROM "ShelfMaterialBatches" s WHERE "MaterialBatchId" IN (SELECT id FROM repair_batches)) THEN RAISE EXCEPTION 'Repair changed shelf evidence'; END IF;
 IF (SELECT evidence->'remainingRmg002' FROM repair_before) IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(b) ORDER BY b."Id") FROM "MaterialBatches" b WHERE b."MaterialId"=(SELECT id FROM repair_materials WHERE code='RMG002') AND b."Id" NOT IN (SELECT id FROM repair_batches)) THEN RAISE EXCEPTION 'Repair changed another RMG002 batch'; END IF;
END $$;
SET CONSTRAINTS ALL IMMEDIATE;
SELECT jsonb_build_object('database',current_database(),'repair','rmg001-two-opening-batches-v1','apply',:'apply'::boolean,'before',(SELECT evidence FROM repair_before),
 'after',(SELECT jsonb_agg(jsonb_build_object('id',b."Id",'number',b."BatchNumber",'materialId',b."MaterialId",'code',m."Code",'quantity',b."TotalQuantity") ORDER BY b."BatchNumber") FROM "MaterialBatches" b JOIN "Materials" m ON m."Id"=b."MaterialId" WHERE b."Id" IN (SELECT id FROM repair_batches)));
\if :apply
COMMIT;
\else
ROLLBACK;
\endif
