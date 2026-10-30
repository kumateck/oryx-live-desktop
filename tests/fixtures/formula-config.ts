// A disposable PostgreSQL schema matching the backend columns the formula-config repair reads and writes.
export const formulaIds = {
  atr: "01a1886d-2a13-71d7-b712-4ad6b1a338b3", actor: "20000000-0000-0000-0000-000000000001",
  role: "20000000-0000-0000-0000-000000000002", form: "20000000-0000-0000-0000-000000000003",
  section: "20000000-0000-0000-0000-000000000004", uniformityQuestion: "20000000-0000-0000-0000-000000000005",
  uniformityOption: "20000000-0000-0000-0000-000000000006", uniformityField: "20000000-0000-0000-0000-000000000007",
  ard: "20000000-0000-0000-0000-000000000008", bmr: "20000000-0000-0000-0000-000000000009",
  step: "20000000-0000-0000-0000-00000000000a", openResponse: "20000000-0000-0000-0000-00000000000b",
  openAnswer: "20000000-0000-0000-0000-00000000000c",
};
const ids = formulaIds;
/** As saved by the uniformity builder: settings wrapped in a JSON string. */
export const uniformityDefinition = JSON.stringify(JSON.stringify({ type: 3, mode: "tube", sampleCount: 0, nominal: null, percent: false }));

const base = '"Id" uuid PRIMARY KEY, "CreatedAt" timestamptz NOT NULL DEFAULT now(), "UpdatedAt" timestamptz, "CreatedById" uuid, "LastUpdatedById" uuid, "DeletedAt" timestamptz, "LastDeletedById" uuid';
const schemas: Record<string, string> = {
  users: '"IsDisabled" boolean NOT NULL DEFAULT false',
  roles: '"Name" text',
  Questions: '"Label" text, "Type" integer NOT NULL',
  QuestionOptions: '"QuestionId" uuid NOT NULL REFERENCES "Questions"("Id"), "Name" text',
  QuestionFormulaDefinitions: '"QuestionId" uuid NOT NULL REFERENCES "Questions"("Id")',
  Forms: '"Name" text',
  FormSections: '"FormId" uuid NOT NULL REFERENCES "Forms"("Id"), "Name" text, "Order" integer NOT NULL DEFAULT 0',
  FormFields: '"FormSectionId" uuid NOT NULL REFERENCES "FormSections"("Id"), "QuestionId" uuid NOT NULL REFERENCES "Questions"("Id"), "Required" boolean NOT NULL DEFAULT true, "Rank" integer NOT NULL DEFAULT 0',
  ProductAnalyticalRawData: '"FormId" uuid NOT NULL REFERENCES "Forms"("Id")',
  AnalyticalTestRequests: '"Stage" integer NOT NULL DEFAULT 2, "Status" integer NOT NULL DEFAULT 0, "BatchManufacturingRecordId" uuid NOT NULL, "ProductionActivityStepId" uuid NOT NULL, "ChemicalArdId" uuid, "MicrobialArdId" uuid',
  Responses: '"FormId" uuid NOT NULL REFERENCES "Forms"("Id"), "FormRevisionId" uuid, "BatchManufacturingRecordId" uuid, "ProductionActivityStepId" uuid, "CheckedAt" timestamptz, "Approved" boolean NOT NULL DEFAULT false, "Rejected" boolean NOT NULL DEFAULT false',
  FormResponses: '"ResponseId" uuid NOT NULL REFERENCES "Responses"("Id"), "FormFieldId" uuid NOT NULL REFERENCES "FormFields"("Id"), "Value" text',
  ResponseFormulaSubmissionSets: '"ResponseId" uuid NOT NULL REFERENCES "Responses"("Id")',
  ResponseFormulaSnapshots: '"ResponseId" uuid NOT NULL REFERENCES "Responses"("Id")',
  FormFieldRevisions: '"FormRevisionId" uuid NOT NULL, "FormFieldId" uuid NOT NULL REFERENCES "FormFields"("Id")',
  FormFieldFormulaConfigurations: '"FormFieldRevisionId" uuid NOT NULL REFERENCES "FormFieldRevisions"("Id")',
};
const others = ["userroles", "roleclaims", "PermissionTypes"];
const tables = [...Object.keys(schemas), ...others].map((name) => `"${name}"`).join(", ");

export const formulaSchemaSql = Object.entries(schemas).map(([table, columns]) => `CREATE TABLE "${table}" (${base}, ${columns});`).join("\n") + `
CREATE TABLE userroles ("UserId" uuid NOT NULL, "RoleId" uuid NOT NULL);
CREATE TABLE roleclaims ("Id" integer PRIMARY KEY, "RoleId" uuid NOT NULL, "ClaimValue" text);
CREATE TABLE "PermissionTypes" ("Id" uuid PRIMARY KEY, "RoleClaimId" integer, "Key" text);`;

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
export const formulaSeedSql = `TRUNCATE ${tables} CASCADE;
DO $reset$ BEGIN IF to_regclass('public."_FormulaConfigRepairs"') IS NOT NULL THEN TRUNCATE "_FormulaConfigRepairs"; END IF; END $reset$;
INSERT INTO users ("Id") VALUES ('${ids.actor}');
INSERT INTO roles ("Id", "Name") VALUES ('${ids.role}', 'QA');
INSERT INTO userroles VALUES ('${ids.actor}', '${ids.role}');
INSERT INTO roleclaims VALUES (1, '${ids.role}', 'CanEditQuestions');
INSERT INTO "PermissionTypes" VALUES ('${ids.role}', 1, 'CanEditQuestions');
INSERT INTO "Questions" ("Id", "Label", "Type") VALUES ('${ids.uniformityQuestion}', 'Uniformity of Weight tablet', 10);
INSERT INTO "QuestionOptions" ("Id", "QuestionId", "Name") VALUES ('${ids.uniformityOption}', '${ids.uniformityQuestion}', ${literal(uniformityDefinition)});
INSERT INTO "Forms" ("Id", "Name") VALUES ('${ids.form}', 'Finished product ARD');
INSERT INTO "FormSections" ("Id", "FormId", "Name") VALUES ('${ids.section}', '${ids.form}', 'Tests');
INSERT INTO "FormFields" ("Id", "FormSectionId", "QuestionId") VALUES ('${ids.uniformityField}', '${ids.section}', '${ids.uniformityQuestion}');
INSERT INTO "ProductAnalyticalRawData" ("Id", "FormId") VALUES ('${ids.ard}', '${ids.form}');
INSERT INTO "AnalyticalTestRequests" ("Id", "BatchManufacturingRecordId", "ProductionActivityStepId", "ChemicalArdId") VALUES ('${ids.atr}', '${ids.bmr}', '${ids.step}', '${ids.ard}');
INSERT INTO "Responses" ("Id", "FormId", "BatchManufacturingRecordId", "ProductionActivityStepId") VALUES ('${ids.openResponse}', '${ids.form}', '${ids.bmr}', '${ids.step}');
INSERT INTO "FormResponses" ("Id", "ResponseId", "FormFieldId", "Value") VALUES ('${ids.openAnswer}', '${ids.openResponse}', '${ids.uniformityField}', '{"inputs":{"bulkTotal":"321","indWts":[]}}');`;

export const formulaDropSql = `DROP TABLE IF EXISTS "_FormulaConfigRepairs", ${tables} CASCADE;`;
