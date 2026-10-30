-- Read only: one ATR's formula questions, their stored definitions and the ATR's saved answers.
DO $find$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public."AnalyticalTestRequests" WHERE "Id" = current_setting('oryx_repair.atr')::uuid) THEN
    RAISE EXCEPTION 'ATR not found';
  END IF;
END $find$;
SELECT jsonb_build_object(
  'atr', jsonb_build_object('id', atr."Id", 'stage', atr."Stage", 'status', atr."Status", 'deletedAt', atr."DeletedAt",
    'batchManufacturingRecordId', atr."BatchManufacturingRecordId", 'productionActivityStepId', atr."ProductionActivityStepId"),
  'forms', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'ard', ard.kind, 'ardId', ard.id, 'formId', f."Id", 'formName', f."Name",
    'formulaFields', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'formFieldId', ff."Id", 'questionId', q."Id", 'label', q."Label", 'required', ff."Required",
      'governed', EXISTS (SELECT 1 FROM public."QuestionFormulaDefinitions" link WHERE link."QuestionId" = q."Id"),
      'formsUsingQuestion', (SELECT count(DISTINCT s2."FormId") FROM public."FormFields" f2
        JOIN public."FormSections" s2 ON s2."Id" = f2."FormSectionId" WHERE f2."QuestionId" = q."Id" AND f2."DeletedAt" IS NULL),
      'options', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', o."Id",
        'sha256', encode(sha256(convert_to(coalesce(o."Name", ''), 'UTF8')), 'hex'), 'definition', o."Name") ORDER BY o."CreatedAt"), '[]')
        FROM public."QuestionOptions" o WHERE o."QuestionId" = q."Id" AND o."DeletedAt" IS NULL)
    ) ORDER BY s."Order", ff."Rank"), '[]')
      FROM public."FormSections" s JOIN public."FormFields" ff ON ff."FormSectionId" = s."Id" AND ff."DeletedAt" IS NULL
      JOIN public."Questions" q ON q."Id" = ff."QuestionId"
      WHERE s."FormId" = f."Id" AND s."DeletedAt" IS NULL AND q."Type" = 10)
  )), '[]') FROM (VALUES ('chemical', atr."ChemicalArdId"), ('microbial', atr."MicrobialArdId")) AS ard(kind, id)
    JOIN public."ProductAnalyticalRawData" raw ON raw."Id" = ard.id
    JOIN public."Forms" f ON f."Id" = raw."FormId"),
  'responses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', r."Id", 'formId', r."FormId", 'formRevisionId', r."FormRevisionId", 'checkedAt', r."CheckedAt",
    'approved', r."Approved", 'rejected', r."Rejected", 'deletedAt', r."DeletedAt",
    'submissionSets', (SELECT count(*) FROM public."ResponseFormulaSubmissionSets" ss WHERE ss."ResponseId" = r."Id"),
    'snapshots', (SELECT count(*) FROM public."ResponseFormulaSnapshots" sn WHERE sn."ResponseId" = r."Id"),
    'formulaAnswers', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', a."Id", 'formFieldId', a."FormFieldId",
      'createdAt', a."CreatedAt", 'sha256', encode(sha256(convert_to(coalesce(a."Value", ''), 'UTF8')), 'hex'), 'value', a."Value")
      ORDER BY a."FormFieldId", a."CreatedAt"), '[]')
      FROM public."FormResponses" a JOIN public."FormFields" ff ON ff."Id" = a."FormFieldId"
      JOIN public."Questions" q ON q."Id" = ff."QuestionId"
      WHERE a."ResponseId" = r."Id" AND a."DeletedAt" IS NULL AND q."Type" = 10)
  ) ORDER BY r."CreatedAt"), '[]') FROM public."Responses" r
    WHERE r."BatchManufacturingRecordId" = atr."BatchManufacturingRecordId"
      AND r."ProductionActivityStepId" = atr."ProductionActivityStepId")
)::text FROM public."AnalyticalTestRequests" atr WHERE atr."Id" = current_setting('oryx_repair.atr')::uuid;
