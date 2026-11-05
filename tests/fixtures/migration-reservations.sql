CREATE TABLE users ("Id" uuid PRIMARY KEY, "Email" text, "DepartmentId" uuid, "IsDisabled" boolean DEFAULT false, "DeletedAt" timestamptz);
CREATE TABLE roles ("Id" uuid PRIMARY KEY, "DeletedAt" timestamptz);
CREATE TABLE userroles ("UserId" uuid, "RoleId" uuid);
CREATE TABLE roleclaims ("Id" integer PRIMARY KEY, "RoleId" uuid, "ClaimType" text, "ClaimValue" text);
CREATE TABLE "PermissionTypes" ("RoleClaimId" integer, "Key" text, "Type" text);
CREATE TABLE "StockMigrations" ("Id" uuid PRIMARY KEY, "DepartmentId" uuid, "ApprovedAt" timestamptz, "FileName" text, "Status" integer, "Mode" integer, "DeletedAt" timestamptz);
CREATE TABLE "StockMigrationLines" ("StockMigrationId" uuid, "ImportedBatchId" uuid, "DeletedAt" timestamptz);
CREATE TABLE "StockMigrationWriteOffs" ("MaterialBatchId" uuid, "StockMigrationId" uuid);
CREATE TABLE "Materials" ("Id" uuid PRIMARY KEY, "Kind" integer, "Code" text, "DeletedAt" timestamptz);
CREATE TABLE "MaterialBatches" ("Id" uuid PRIMARY KEY, "MaterialId" uuid, "Status" integer, "UoMId" uuid, "TotalQuantity" numeric, "ConsumedQuantity" numeric DEFAULT 0, "ExpiryDate" timestamptz, "RetestDate" timestamptz, "DeletedAt" timestamptz);
CREATE TABLE "Requisitions" ("Id" uuid PRIMARY KEY, "Code" text, "ProductionScheduleProductId" uuid, "DepartmentId" uuid, "Approved" boolean, "RequisitionType" integer DEFAULT 0, "Status" integer DEFAULT 1, "DeletedAt" timestamptz, "UpdatedAt" timestamptz);
CREATE TABLE "RequisitionItems" ("Id" uuid PRIMARY KEY, "RequisitionId" uuid, "MaterialId" uuid, "Quantity" numeric, "UoMId" uuid, "Status" integer DEFAULT 1, "QuantityReceived" numeric DEFAULT 0, "DeletedAt" timestamptz);
CREATE TABLE "StockRequisitionIssues" ("RequisitionId" uuid);
CREATE TABLE "ProductionScheduleProducts" ("Id" uuid PRIMARY KEY, "ProductionScheduleId" uuid, "Cancelled" boolean DEFAULT false);
CREATE TABLE "ProductionSchedules" ("Id" uuid PRIMARY KEY, "Status" integer DEFAULT 1, "DeletedAt" timestamptz);
CREATE TABLE "ProductionActivities" ("Id" uuid PRIMARY KEY, "ProductionScheduleProductId" uuid, "Status" integer DEFAULT 1, "CompletedAt" timestamptz, "DeletedAt" timestamptz);
CREATE TABLE "ProductionActivitySteps" ("ProductionActivityId" uuid, "OperationId" uuid, "StartedAt" timestamptz, "CompletedAt" timestamptz, "Status" integer DEFAULT 0, "DeletedAt" timestamptz);
CREATE TABLE "Operations" ("Id" uuid PRIMARY KEY, "Name" text);
CREATE TABLE "MaterialReturnNotes" ("ProductionScheduleProductId" uuid);
CREATE TABLE "ProductionExtraPackings" ("ProductionScheduleProductId" uuid);
CREATE TABLE "FinalPackings" ("ProductionScheduleProductId" uuid);
CREATE TABLE "Warehouses" ("Id" uuid PRIMARY KEY, "DepartmentId" uuid, "Type" integer, "DeletedAt" timestamptz);
CREATE TABLE "WarehouseLocations" ("Id" uuid PRIMARY KEY, "WarehouseId" uuid, "DeletedAt" timestamptz);
CREATE TABLE "WarehouseLocationRacks" ("Id" uuid PRIMARY KEY, "WarehouseLocationId" uuid, "DeletedAt" timestamptz);
CREATE TABLE "WarehouseLocationShelves" ("Id" uuid PRIMARY KEY, "WarehouseLocationRackId" uuid, "DeletedAt" timestamptz);
CREATE TABLE "ShelfMaterialBatches" ("Id" uuid PRIMARY KEY, "MaterialBatchId" uuid, "WarehouseLocationShelfId" uuid, "UoMId" uuid, "Quantity" numeric, "DeletedAt" timestamptz);
CREATE TABLE "MaterialBatchReservedQuantities" ("Id" uuid PRIMARY KEY, "MaterialBatchId" uuid REFERENCES "MaterialBatches", "WarehouseLocationShelfId" uuid, "WarehouseId" uuid, "ProductionScheduleProductId" uuid, "Quantity" numeric, "UoMId" uuid, "UpdatedAt" timestamptz, "LastUpdatedById" uuid, "DeletedAt" timestamptz);
CREATE TABLE "BinCardInformation" ("MaterialBatchId" uuid, "WarehouseId" uuid, "RequisitionId" uuid, "QuantityReceived" numeric DEFAULT 0, "QuantityIssued" numeric DEFAULT 0);
CREATE TABLE "MassMaterialBatchMovements" ("BatchId" uuid, "Quantity" numeric);
CREATE TABLE "MaterialBatchEvents" ("BatchId" uuid, "Quantity" numeric);

-- IDs use a fixed prefix and distinct integer suffixes; all quantities are synthetic.
INSERT INTO users VALUES ('00000000-0000-4000-8000-000000000001','warehouse@example.test','00000000-0000-4000-8000-000000000002',false,NULL);
INSERT INTO roles VALUES ('00000000-0000-4000-8000-000000000003',NULL);
INSERT INTO userroles VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003');
INSERT INTO roleclaims VALUES (1,'00000000-0000-4000-8000-000000000003','permission','CanIssuePackagingMaterialRequisitions');
INSERT INTO "PermissionTypes" VALUES (1,'CanIssuePackagingMaterialRequisitions','Action');
INSERT INTO "StockMigrations" VALUES ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','2026-11-01','Synthetic replacement',1,0,NULL);
INSERT INTO "Materials" VALUES ('00000000-0000-4000-8000-000000000005',1,'PM-SYNTHETIC',NULL);
INSERT INTO "MaterialBatches" ("Id","MaterialId","Status","UoMId","TotalQuantity") VALUES
 ('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000005',7,'00000000-0000-4000-8000-000000000008',1000),
 ('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000005',3,'00000000-0000-4000-8000-000000000008',1000);
INSERT INTO "StockMigrationWriteOffs" VALUES ('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000004');
INSERT INTO "StockMigrationLines" VALUES ('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000007',NULL);
INSERT INTO "Warehouses" VALUES
 ('00000000-0000-4000-8000-000000000009','00000000-0000-4000-8000-000000000002',1,NULL),
 ('00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002',3,NULL);
INSERT INTO "WarehouseLocations" VALUES ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000009',NULL);
INSERT INTO "WarehouseLocationRacks" VALUES ('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000011',NULL);
INSERT INTO "WarehouseLocationShelves" VALUES ('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000012',NULL);
INSERT INTO "ShelfMaterialBatches" VALUES ('00000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000008',1000,NULL);
INSERT INTO "BinCardInformation" VALUES ('00000000-0000-4000-8000-000000000007','00000000-0000-4000-8000-000000000009',NULL,1000,0);
INSERT INTO "ProductionSchedules" ("Id") VALUES ('00000000-0000-4000-8000-000000000015');
INSERT INTO "ProductionScheduleProducts" ("Id","ProductionScheduleId") SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000015' FROM generate_series(20,22) n;
INSERT INTO "ProductionActivities" ("Id","ProductionScheduleProductId") SELECT ('00000000-0000-4000-8000-'||lpad((n+10)::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(20,22) n;
INSERT INTO "Requisitions" ("Id","Code","ProductionScheduleProductId","DepartmentId","Approved","Status") SELECT ('00000000-0000-4000-8000-'||lpad((n+20)::text,12,'0'))::uuid,'PM/SYNTHETIC/'||n,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000002',true,CASE WHEN n=22 THEN 3 ELSE 1 END FROM generate_series(20,22) n;
INSERT INTO "RequisitionItems" ("Id","RequisitionId","MaterialId","Quantity","UoMId","Status") SELECT ('00000000-0000-4000-8000-'||lpad((n+30)::text,12,'0'))::uuid,('00000000-0000-4000-8000-'||lpad((n+20)::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000005',10,'00000000-0000-4000-8000-000000000008',CASE WHEN n=22 THEN 3 ELSE 1 END FROM generate_series(20,22) n;
INSERT INTO "MaterialBatchReservedQuantities" ("Id","MaterialBatchId","WarehouseLocationShelfId","WarehouseId","ProductionScheduleProductId","Quantity","UoMId") SELECT ('00000000-0000-4000-8000-'||lpad((n+40)::text,12,'0'))::uuid,'00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000010',('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,10,'00000000-0000-4000-8000-000000000008' FROM generate_series(20,22) n;
INSERT INTO "StockRequisitionIssues" VALUES ('00000000-0000-4000-8000-000000000042');
