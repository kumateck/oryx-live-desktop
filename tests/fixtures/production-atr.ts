// A disposable PostgreSQL schema matching the backend columns used by the repair.
export const ids = {
  activity: "01a1757c-7819-7e2f-ad68-d5e10a1a35cf", step: "10000000-0000-0000-0000-000000000001",
  product: "10000000-0000-0000-0000-000000000002", ard: "10000000-0000-0000-0000-000000000003",
  actor: "10000000-0000-0000-0000-000000000004", batch: "10000000-0000-0000-0000-000000000005",
  route: "10000000-0000-0000-0000-000000000006", other: "10000000-0000-0000-0000-000000000007",
};
const base = '"Id" uuid PRIMARY KEY, "CreatedAt" timestamptz NOT NULL DEFAULT now(), "UpdatedAt" timestamptz, "CreatedById" uuid, "LastUpdatedById" uuid, "DeletedAt" timestamptz, "LastDeletedById" uuid';
const schemas: Record<string, string> = {
  users: '"IsDisabled" boolean NOT NULL DEFAULT false, "DepartmentId" uuid',
  roles: '"Name" text',
  Products: '"Name" text, "DepartmentId" uuid',
  ProductionSchedules: '"Status" integer NOT NULL DEFAULT 1',
  Operations: '"Name" text',
  ProductionScheduleProducts: '"ProductId" uuid NOT NULL, "ProductionScheduleId" uuid NOT NULL, "BatchNumber" text NOT NULL, "Cancelled" boolean NOT NULL DEFAULT false',
  ProductionActivities: '"ProductionScheduleProductId" uuid NOT NULL REFERENCES "ProductionScheduleProducts"("Id"), "Status" integer NOT NULL DEFAULT 1, "StartedAt" timestamptz NOT NULL DEFAULT now(), "CompletedAt" timestamptz',
  ProductionActivitySteps: '"ProductionActivityId" uuid NOT NULL REFERENCES "ProductionActivities"("Id"), "OperationId" uuid NOT NULL, "Order" integer NOT NULL, "Status" integer NOT NULL DEFAULT 1, "StartedAt" timestamptz, "CompletedAt" timestamptz',
  Forms: '"Name" text',
  ProductStandardTestProcedures: '"ProductId" uuid NOT NULL',
  ProductAnalyticalRawData: '"StpId" uuid NOT NULL REFERENCES "ProductStandardTestProcedures"("Id"), "FormId" uuid NOT NULL REFERENCES "Forms"("Id"), "Stage" integer NOT NULL, "AnalysisType" integer NOT NULL DEFAULT 0, "IsVerified" boolean NOT NULL DEFAULT true, "SpecNumber" text',
  ProductionActivityStepUsers: '"ProductionActivityStepId" uuid NOT NULL REFERENCES "ProductionActivitySteps"("Id"), "UserId" uuid NOT NULL REFERENCES users("Id"), "Action" integer NOT NULL DEFAULT 7, "ProductAnalyticalRawDataId" uuid REFERENCES "ProductAnalyticalRawData"("Id")',
  Routes: '"ProductId" uuid NOT NULL, "OperationId" uuid NOT NULL, "Order" integer NOT NULL',
  RouteResponsibleUsers: '"RouteId" uuid NOT NULL, "UserId" uuid, "Action" integer NOT NULL DEFAULT 7, "ProductAnalyticalRawDataId" uuid REFERENCES "ProductAnalyticalRawData"("Id")',
  RouteResponsibleRoles: '"RouteId" uuid NOT NULL, "RoleId" uuid, "Action" integer NOT NULL DEFAULT 7, "ProductAnalyticalRawDataId" uuid REFERENCES "ProductAnalyticalRawData"("Id")',
  AnalyticalTestRequests: '"ProductionActivityStepId" uuid NOT NULL, "ProductionScheduleProductId" uuid NOT NULL, "Stage" integer NOT NULL, "Status" integer NOT NULL DEFAULT 0',
  BatchManufacturingRecords: '"ProductionScheduleProductId" uuid NOT NULL',
  MicrobialRequirements: '"ProductId" uuid, "Subject" integer NOT NULL DEFAULT 1, "Stage" integer, "Required" boolean NOT NULL DEFAULT true, "IsVerified" boolean NOT NULL DEFAULT true, "VerifiedAt" timestamptz',
  ProductionActivityLogs: '"ProductionActivityId" uuid NOT NULL REFERENCES "ProductionActivities"("Id"), "Message" varchar(1000), "UserId" uuid REFERENCES users("Id"), "Timestamp" timestamptz NOT NULL',
};
export const schemaSql = Object.entries(schemas).map(([table, columns]) => `CREATE TABLE "${table}" (${base}, ${columns});`).join("\n") + `
CREATE TABLE userroles ("UserId" uuid NOT NULL, "RoleId" uuid NOT NULL);
CREATE TABLE roleclaims ("Id" integer PRIMARY KEY, "RoleId" uuid NOT NULL, "ClaimValue" text);
CREATE TABLE "PermissionTypes" ("Id" uuid PRIMARY KEY, "RoleClaimId" integer, "Key" text);`;
export const resetSql = `TRUNCATE ${[...Object.keys(schemas), "userroles", "roleclaims", "PermissionTypes"].map((name) => `"${name}"`).join(", ")} CASCADE;
DO $reset$ BEGIN IF to_regclass('public."_ProductionAtrRepairs"') IS NOT NULL THEN TRUNCATE "_ProductionAtrRepairs"; END IF; END $reset$;
INSERT INTO users ("Id", "DepartmentId") VALUES ('${ids.actor}', '${ids.other}');
INSERT INTO roles ("Id", "Name") VALUES ('${ids.other}', 'Planner');
INSERT INTO userroles VALUES ('${ids.actor}', '${ids.other}');
INSERT INTO roleclaims VALUES (1, '${ids.other}', 'CanEditProductionPlan');
INSERT INTO "PermissionTypes" VALUES ('${ids.other}', 1, 'CanEditProductionPlan');
INSERT INTO "Products" ("Id", "Name", "DepartmentId") VALUES ('${ids.product}', 'Coldrilif Syrup', '${ids.other}');
INSERT INTO "ProductionSchedules" ("Id") VALUES ('${ids.other}');
INSERT INTO "Operations" ("Id", "Name") VALUES ('${ids.other}', 'Test');
INSERT INTO "ProductionScheduleProducts" ("Id", "ProductId", "ProductionScheduleId", "BatchNumber") VALUES ('${ids.batch}', '${ids.product}', '${ids.other}', '4862');
INSERT INTO "ProductionActivities" ("Id", "ProductionScheduleProductId") VALUES ('${ids.activity}', '${ids.batch}');
INSERT INTO "ProductionActivitySteps" ("Id", "ProductionActivityId", "OperationId", "Order") VALUES ('${ids.step}', '${ids.activity}', '${ids.other}', 10);
INSERT INTO "Forms" ("Id") VALUES ('${ids.other}');
INSERT INTO "ProductStandardTestProcedures" ("Id", "ProductId") VALUES ('${ids.other}', '${ids.product}');
INSERT INTO "ProductAnalyticalRawData" ("Id", "StpId", "FormId", "Stage") VALUES ('${ids.ard}', '${ids.other}', '${ids.other}', 1);
INSERT INTO "ProductionActivityStepUsers" ("Id", "ProductionActivityStepId", "UserId") VALUES ('${ids.other}', '${ids.step}', '${ids.actor}');
INSERT INTO "Routes" ("Id", "ProductId", "OperationId", "Order") VALUES ('${ids.route}', '${ids.product}', '${ids.other}', 10);
INSERT INTO "RouteResponsibleUsers" ("Id", "RouteId", "ProductAnalyticalRawDataId") VALUES ('${ids.other}', '${ids.route}', '${ids.ard}');
INSERT INTO "RouteResponsibleRoles" ("Id", "RouteId", "ProductAnalyticalRawDataId") VALUES ('${ids.other}', '${ids.route}', '${ids.ard}');
INSERT INTO "BatchManufacturingRecords" ("Id", "ProductionScheduleProductId") VALUES ('${ids.other}', '${ids.batch}');`;

export const dropSql = `DROP TABLE IF EXISTS "_ProductionAtrRepairs", ${[...Object.keys(schemas), "userroles", "roleclaims", "PermissionTypes"].map((name) => `"${name}"`).join(", ")} CASCADE;`;
