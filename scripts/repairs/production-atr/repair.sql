-- Apply takes short table locks because existing application writers do not share
-- a repair advisory lock. This also prevents phantom ATRs/assignments/ARDs.
DO $locks$ BEGIN
  IF current_setting('oryx_repair.apply')::boolean THEN
    LOCK TABLE public."ProductionActivities", public."ProductionActivitySteps",
      public."ProductionActivityStepUsers", public."ProductionScheduleProducts",
      public."ProductionSchedules", public."Products", public."Operations",
      public."Routes", public."RouteResponsibleUsers", public."RouteResponsibleRoles",
      public."ProductAnalyticalRawData", public."ProductStandardTestProcedures", public."Forms",
      public."AnalyticalTestRequests", public."MicrobialRequirements", public."BatchManufacturingRecords",
      public.users, public.roles, public.userroles, public.roleclaims, public."PermissionTypes"
      IN SHARE ROW EXCLUSIVE MODE;
  END IF;
END $locks$;
DO $repair$
DECLARE
  activity_id uuid := current_setting('oryx_repair.activity')::uuid;
  step_id uuid := current_setting('oryx_repair.step')::uuid;
  product_id uuid := current_setting('oryx_repair.product')::uuid;
  ard_id uuid := current_setting('oryx_repair.ard')::uuid;
  actor_id uuid := current_setting('oryx_repair.actor')::uuid;
  test_stage integer := current_setting('oryx_repair.stage')::integer;
  fix_procedure boolean := current_setting('oryx_repair.repairprocedure')::boolean;
  batch_id uuid;
  route_id uuid;
  source_count integer;
  changed_count integer;
  microbial_required boolean;
  chemical_form uuid;
  microbial_form uuid;
  before_rows jsonb;
  after_rows jsonb;
  repair_id uuid := gen_random_uuid();
  report jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users u JOIN public.userroles ur ON ur."UserId" = u."Id"
    JOIN public.roles r ON r."Id" = ur."RoleId" AND r."DeletedAt" IS NULL
    JOIN public.roleclaims rc ON rc."RoleId" = r."Id"
    JOIN public."PermissionTypes" pt ON pt."RoleClaimId" = rc."Id"
    WHERE u."Id" = actor_id AND NOT u."IsDisabled" AND u."DeletedAt" IS NULL
      AND rc."ClaimValue" = 'CanEditProductionPlan' AND pt."Key" = 'CanEditProductionPlan'
  ) THEN RAISE EXCEPTION 'Active operator requires existing CanEditProductionPlan permission'; END IF;

  SELECT b."Id" INTO batch_id FROM public."ProductionActivities" a
    JOIN public."ProductionScheduleProducts" b ON b."Id" = a."ProductionScheduleProductId"
    JOIN public."ProductionSchedules" schedule ON schedule."Id" = b."ProductionScheduleId"
    JOIN public."Products" p ON p."Id" = b."ProductId"
    JOIN public."ProductionActivitySteps" s ON s."ProductionActivityId" = a."Id"
    JOIN public."Operations" o ON o."Id" = s."OperationId"
    WHERE a."Id" = activity_id AND s."Id" = step_id AND b."ProductId" = product_id
      AND EXISTS (SELECT 1 FROM public.users operator WHERE operator."Id" = actor_id AND operator."DepartmentId" = p."DepartmentId")
      AND b."BatchNumber" = current_setting('oryx_repair.batch') AND NOT b."Cancelled"
      AND a."DeletedAt" IS NULL AND a."CompletedAt" IS NULL AND a."Status" IN (0, 1, 3)
      AND s."DeletedAt" IS NULL AND s."CompletedAt" IS NULL AND s."Status" IN (0, 1, 3)
      AND p."DeletedAt" IS NULL AND o."DeletedAt" IS NULL AND schedule."DeletedAt" IS NULL;
  IF batch_id IS NULL THEN RAISE EXCEPTION 'Activity/step/product/batch/department mismatch, deleted record, or terminal production'; END IF;

  IF EXISTS (SELECT 1 FROM public."AnalyticalTestRequests"
    WHERE "ProductionActivityStepId" = step_id OR ("ProductionScheduleProductId" = batch_id AND "Stage" = test_stage)) THEN
    RAISE EXCEPTION 'An ATR already exists for this step or batch/stage (including deleted history); reconcile manually';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public."BatchManufacturingRecords"
    WHERE "ProductionScheduleProductId" = batch_id AND "DeletedAt" IS NULL) THEN
    RAISE EXCEPTION 'Batch manufacturing record is missing';
  END IF;

  -- Match backend QualityAnalysisSnapshot.ForProductAsync: one verified Chemical
  -- ARD, plus distinct Microbial worksheet when the finished-stage rule requires it.
  SELECT count(*), (array_agg(ard."FormId"))[1] INTO source_count, chemical_form
    FROM public."ProductAnalyticalRawData" ard
    JOIN public."ProductStandardTestProcedures" stp ON stp."Id" = ard."StpId"
    WHERE stp."ProductId" = product_id AND stp."DeletedAt" IS NULL AND ard."DeletedAt" IS NULL
      AND ard."IsVerified" AND ard."Stage" = test_stage AND ard."AnalysisType" = 0;
  IF source_count <> 1 OR NOT EXISTS (
    SELECT 1 FROM public."ProductAnalyticalRawData" ard
    JOIN public."ProductStandardTestProcedures" stp ON stp."Id" = ard."StpId"
    JOIN public."Forms" f ON f."Id" = ard."FormId" AND f."DeletedAt" IS NULL
    WHERE ard."Id" = ard_id AND stp."ProductId" = product_id AND stp."DeletedAt" IS NULL
      AND ard."DeletedAt" IS NULL AND ard."IsVerified" AND ard."Stage" = test_stage AND ard."AnalysisType" = 0
  ) THEN RAISE EXCEPTION 'Choose the unique active verified Chemical ARD for this product/stage with an active form'; END IF;
  SELECT coalesce((SELECT "Required" FROM public."MicrobialRequirements"
    WHERE "Subject" = 1 AND "ProductId" = product_id AND "Stage" = test_stage
      AND test_stage = 2 AND "IsVerified" AND "DeletedAt" IS NULL
    ORDER BY "VerifiedAt" DESC, "CreatedAt" DESC LIMIT 1), false) INTO microbial_required;
  IF microbial_required THEN
    SELECT count(*), (array_agg(ard."FormId"))[1] INTO source_count, microbial_form
      FROM public."ProductAnalyticalRawData" ard
      JOIN public."ProductStandardTestProcedures" stp ON stp."Id" = ard."StpId"
      WHERE stp."ProductId" = product_id AND stp."DeletedAt" IS NULL AND ard."DeletedAt" IS NULL
        AND ard."IsVerified" AND ard."Stage" = test_stage AND ard."AnalysisType" = 1;
    IF source_count <> 1 OR microbial_form = chemical_form OR NOT EXISTS (
      SELECT 1 FROM public."Forms" WHERE "Id" = microbial_form AND "DeletedAt" IS NULL
    ) THEN RAISE EXCEPTION 'Required verified Microbial ARD is missing/ambiguous or has no distinct active form'; END IF;
  END IF;

  IF (SELECT count(*) FROM public."ProductionActivityStepUsers"
    WHERE "ProductionActivityStepId" = step_id AND "Action" = 7 AND "DeletedAt" IS NULL)
      <> current_setting('oryx_repair.expectedassignments')::integer THEN
    RAISE EXCEPTION 'ATR assignment count changed; inspect again';
  END IF;
  IF EXISTS (SELECT 1 FROM public."ProductionActivityStepUsers" su
    JOIN public.users u ON u."Id" = su."UserId"
    WHERE su."ProductionActivityStepId" = step_id AND su."Action" = 7 AND su."DeletedAt" IS NULL
      AND (u."DeletedAt" IS NOT NULL OR u."IsDisabled")) THEN
    RAISE EXCEPTION 'ATR assignment belongs to a disabled/deleted user; reconcile assignment first';
  END IF;
  IF EXISTS (SELECT 1 FROM public."ProductionActivityStepUsers"
    WHERE "ProductionActivityStepId" = step_id AND "Action" = 7 AND "DeletedAt" IS NULL
      AND "ProductAnalyticalRawDataId" IS NOT NULL AND "ProductAnalyticalRawDataId" <> ard_id) THEN
    RAISE EXCEPTION 'Existing activity ARD conflicts; this repair only fills missing links';
  END IF;

  SELECT count(*), (array_agg(r."Id"))[1] INTO source_count, route_id FROM public."Routes" r
    JOIN public."ProductionActivitySteps" s ON s."Id" = step_id
    WHERE r."ProductId" = product_id AND r."OperationId" = s."OperationId" AND r."Order" = s."Order"
      AND r."DeletedAt" IS NULL;
  IF source_count <> 1 THEN RAISE EXCEPTION 'Procedure route is missing or ambiguous for this operation/order'; END IF;
  SELECT count(*) INTO source_count FROM (
    SELECT "ProductAnalyticalRawDataId" AS ard FROM public."RouteResponsibleUsers"
      WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL
    UNION ALL SELECT "ProductAnalyticalRawDataId" FROM public."RouteResponsibleRoles"
      WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL
  ) source WHERE source.ard IS NOT NULL AND source.ard <> ard_id;
  IF source_count > 0 THEN RAISE EXCEPTION 'Procedure has conflicting ATR links; reconcile manually'; END IF;
  SELECT count(*) INTO source_count FROM (
    SELECT "ProductAnalyticalRawDataId" AS ard FROM public."RouteResponsibleUsers"
      WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL
    UNION ALL SELECT "ProductAnalyticalRawDataId" FROM public."RouteResponsibleRoles"
      WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL
  ) source;
  IF source_count = 0 THEN RAISE EXCEPTION 'Procedure has no ATR instructions; this repair does not create assignments'; END IF;
  IF NOT fix_procedure AND EXISTS (
    SELECT 1 FROM public."RouteResponsibleUsers" WHERE "RouteId" = route_id AND "Action" = 7
      AND "DeletedAt" IS NULL AND "ProductAnalyticalRawDataId" IS NULL
    UNION ALL SELECT 1 FROM public."RouteResponsibleRoles" WHERE "RouteId" = route_id AND "Action" = 7
      AND "DeletedAt" IS NULL AND "ProductAnalyticalRawDataId" IS NULL
  ) THEN RAISE EXCEPTION 'Procedure ATR link is missing; configure it normally or explicitly use --repair-procedure'; END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('table', source.name, 'row', source.data)), '[]') INTO before_rows FROM (
    SELECT 'ProductionActivityStepUsers' AS name, to_jsonb(u) AS data FROM public."ProductionActivityStepUsers" u
      WHERE u."ProductionActivityStepId" = step_id AND u."Action" = 7 AND u."DeletedAt" IS NULL AND u."ProductAnalyticalRawDataId" IS NULL
    UNION ALL SELECT 'RouteResponsibleUsers', to_jsonb(u) FROM public."RouteResponsibleUsers" u
      WHERE fix_procedure AND u."RouteId" = route_id AND u."Action" = 7 AND u."DeletedAt" IS NULL AND u."ProductAnalyticalRawDataId" IS NULL
    UNION ALL SELECT 'RouteResponsibleRoles', to_jsonb(u) FROM public."RouteResponsibleRoles" u
      WHERE fix_procedure AND u."RouteId" = route_id AND u."Action" = 7 AND u."DeletedAt" IS NULL AND u."ProductAnalyticalRawDataId" IS NULL
  ) source;
  changed_count := jsonb_array_length(before_rows);
  report := jsonb_build_object('mode', CASE WHEN current_setting('oryx_repair.apply')::boolean THEN 'apply' ELSE 'dry-run' END,
    'activityId', activity_id, 'stepId', step_id, 'productId', product_id, 'batchId', batch_id,
    'batch', current_setting('oryx_repair.batch'), 'routeId', route_id, 'ardId', ard_id,
    'stage', test_stage, 'actorId', actor_id, 'reason', current_setting('oryx_repair.reason'),
    'repairProcedure', fix_procedure, 'rowsToChange', changed_count, 'before', before_rows);
  IF current_setting('oryx_repair.apply')::boolean AND changed_count > 0 THEN
    CREATE TABLE IF NOT EXISTS public."_ProductionAtrRepairs" (
      "Id" uuid PRIMARY KEY, "CreatedAt" timestamptz NOT NULL,
      "DatabaseUser" text NOT NULL, "ActorId" uuid NOT NULL,
      "ActivityId" uuid NOT NULL, "StepId" uuid NOT NULL,
      "Reason" text NOT NULL, "Plan" jsonb NOT NULL, "After" jsonb NOT NULL
    );
    UPDATE public."ProductionActivityStepUsers" SET "ProductAnalyticalRawDataId" = ard_id,
      "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id
      WHERE "ProductionActivityStepId" = step_id AND "Action" = 7 AND "DeletedAt" IS NULL AND "ProductAnalyticalRawDataId" IS NULL;
    IF fix_procedure THEN
      UPDATE public."RouteResponsibleUsers" SET "ProductAnalyticalRawDataId" = ard_id,
        "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id
        WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL AND "ProductAnalyticalRawDataId" IS NULL;
      UPDATE public."RouteResponsibleRoles" SET "ProductAnalyticalRawDataId" = ard_id,
        "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id
        WHERE "RouteId" = route_id AND "Action" = 7 AND "DeletedAt" IS NULL AND "ProductAnalyticalRawDataId" IS NULL;
    END IF;
    SELECT jsonb_agg(jsonb_build_object('table', source.name, 'row', source.data)) INTO after_rows FROM (
      SELECT 'ProductionActivityStepUsers' AS name, to_jsonb(u) AS data FROM public."ProductionActivityStepUsers" u WHERE u."ProductionActivityStepId" = step_id
      UNION ALL SELECT 'RouteResponsibleUsers', to_jsonb(u) FROM public."RouteResponsibleUsers" u WHERE fix_procedure AND u."RouteId" = route_id
      UNION ALL SELECT 'RouteResponsibleRoles', to_jsonb(u) FROM public."RouteResponsibleRoles" u WHERE fix_procedure AND u."RouteId" = route_id
    ) source WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(before_rows) original
      WHERE original->>'table' = source.name AND original->'row'->>'Id' = source.data->>'Id');
    IF jsonb_array_length(after_rows) <> changed_count OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(after_rows) item WHERE item->'row'->>'ProductAnalyticalRawDataId' IS DISTINCT FROM ard_id::text
    ) THEN RAISE EXCEPTION 'Post-write verification failed'; END IF;
    INSERT INTO public."_ProductionAtrRepairs" VALUES (repair_id, transaction_timestamp(), current_user,
      actor_id, activity_id, step_id, current_setting('oryx_repair.reason'), report, after_rows);
    INSERT INTO public."ProductionActivityLogs" ("Id", "CreatedAt", "CreatedById", "ProductionActivityId", "Message", "UserId", "Timestamp")
      VALUES (gen_random_uuid(), transaction_timestamp(), actor_id, activity_id,
        format('ATR configuration repaired (repair %s): step %s; ARD %s; stage %s; %s link(s). Reason: %s',
          repair_id, step_id, ard_id, test_stage, changed_count, left(current_setting('oryx_repair.reason'), 600)),
        actor_id, transaction_timestamp());
    report := report || jsonb_build_object('repairId', repair_id, 'after', after_rows);
  END IF;
  RAISE NOTICE '%', jsonb_pretty(report);
END $repair$;
