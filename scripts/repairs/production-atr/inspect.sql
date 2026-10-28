-- Read only: show complete step identity, current links, source instructions and candidate ARDs.
DO $inspect$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."ProductionActivities"
    WHERE "Id" = current_setting('oryx_repair.activity')::uuid AND "DeletedAt" IS NULL) THEN
    RAISE EXCEPTION 'Activity not found';
  END IF;
END $inspect$;
SELECT jsonb_pretty(jsonb_build_object(
  'activityId', a."Id", 'activityStatus', a."Status", 'completedAt', a."CompletedAt",
  'productId', p."Id", 'productName', p."Name", 'batch', b."BatchNumber", 'cancelled', b."Cancelled",
  'steps', (SELECT jsonb_agg(jsonb_build_object(
    'id', s."Id", 'order', s."Order", 'operationId', s."OperationId", 'operation', o."Name",
    'status', s."Status", 'startedAt', s."StartedAt", 'completedAt', s."CompletedAt", 'deletedAt', s."DeletedAt",
    'assignments', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', u."Id", 'userId', u."UserId",
      'action', u."Action", 'ardId', u."ProductAnalyticalRawDataId", 'stage', ard."Stage",
      'deletedAt', u."DeletedAt")), '[]') FROM public."ProductionActivityStepUsers" u
      LEFT JOIN public."ProductAnalyticalRawData" ard ON ard."Id" = u."ProductAnalyticalRawDataId"
      WHERE u."ProductionActivityStepId" = s."Id"),
    'requests', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', atr."Id", 'stage', atr."Stage",
      'status', atr."Status", 'deletedAt', atr."DeletedAt")), '[]') FROM public."AnalyticalTestRequests" atr
      WHERE atr."ProductionActivityStepId" = s."Id"),
    'matchingRoutes', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', r."Id", 'deletedAt', r."DeletedAt",
      'users', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', ru."Id", 'action', ru."Action",
        'ardId', ru."ProductAnalyticalRawDataId", 'deletedAt', ru."DeletedAt")), '[]')
        FROM public."RouteResponsibleUsers" ru WHERE ru."RouteId" = r."Id"),
      'roles', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', rr."Id", 'action', rr."Action",
        'ardId', rr."ProductAnalyticalRawDataId", 'deletedAt', rr."DeletedAt")), '[]')
        FROM public."RouteResponsibleRoles" rr WHERE rr."RouteId" = r."Id"))), '[]')
      FROM public."Routes" r WHERE r."ProductId" = p."Id" AND r."OperationId" = s."OperationId" AND r."Order" = s."Order")
    ) ORDER BY s."Order") FROM public."ProductionActivitySteps" s
      JOIN public."Operations" o ON o."Id" = s."OperationId" WHERE s."ProductionActivityId" = a."Id"),
  'ards', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', ard."Id", 'stage', ard."Stage",
    'analysisType', ard."AnalysisType", 'verified', ard."IsVerified", 'formId', ard."FormId",
    'specNumber', ard."SpecNumber", 'deletedAt', ard."DeletedAt", 'stpDeletedAt', stp."DeletedAt")), '[]')
    FROM public."ProductAnalyticalRawData" ard JOIN public."ProductStandardTestProcedures" stp ON stp."Id" = ard."StpId"
    WHERE stp."ProductId" = p."Id")
)) FROM public."ProductionActivities" a
JOIN public."ProductionScheduleProducts" b ON b."Id" = a."ProductionScheduleProductId"
JOIN public."Products" p ON p."Id" = b."ProductId"
WHERE a."Id" = current_setting('oryx_repair.activity')::uuid;
