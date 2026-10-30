-- Read only: everything a recipe needs to plan a repair of one formula question.
SELECT jsonb_build_object(
  'question', (SELECT jsonb_build_object('id', q."Id", 'label', q."Label", 'type', q."Type", 'deletedAt', q."DeletedAt",
    'governed', EXISTS (SELECT 1 FROM public."QuestionFormulaDefinitions" link WHERE link."QuestionId" = q."Id"))
    FROM public."Questions" q WHERE q."Id" = current_setting('oryx_repair.question')::uuid),
  'options', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', o."Id", 'definition', o."Name") ORDER BY o."CreatedAt"), '[]')
    FROM public."QuestionOptions" o WHERE o."QuestionId" = current_setting('oryx_repair.question')::uuid AND o."DeletedAt" IS NULL),
  'fields', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', ff."Id", 'formId', s."FormId", 'formName', f."Name")), '[]')
    FROM public."FormFields" ff JOIN public."FormSections" s ON s."Id" = ff."FormSectionId" JOIN public."Forms" f ON f."Id" = s."FormId"
    WHERE ff."QuestionId" = current_setting('oryx_repair.question')::uuid AND ff."DeletedAt" IS NULL),
  'responses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', r."Id", 'formId', r."FormId", 'checkedAt', r."CheckedAt", 'approved', r."Approved", 'rejected', r."Rejected",
    'deletedAt', r."DeletedAt",
    'submissionSets', (SELECT count(*) FROM public."ResponseFormulaSubmissionSets" ss WHERE ss."ResponseId" = r."Id"),
    'snapshots', (SELECT count(*) FROM public."ResponseFormulaSnapshots" sn WHERE sn."ResponseId" = r."Id"),
    'governedPlacement', EXISTS (SELECT 1 FROM public."FormFieldRevisions" fr
      JOIN public."FormFieldFormulaConfigurations" c ON c."FormFieldRevisionId" = fr."Id"
      JOIN public."FormFields" ff ON ff."Id" = fr."FormFieldId"
      WHERE fr."FormRevisionId" = r."FormRevisionId" AND ff."QuestionId" = current_setting('oryx_repair.question')::uuid),
    'answers', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', a."Id", 'formFieldId', a."FormFieldId", 'createdAt', a."CreatedAt",
      'value', a."Value") ORDER BY a."CreatedAt"), '[]')
      FROM public."FormResponses" a JOIN public."FormFields" ff ON ff."Id" = a."FormFieldId"
      WHERE a."ResponseId" = r."Id" AND a."DeletedAt" IS NULL AND ff."QuestionId" = current_setting('oryx_repair.question')::uuid)
  ) ORDER BY r."CreatedAt"), '[]') FROM public."Responses" r
    WHERE EXISTS (SELECT 1 FROM public."FormResponses" a JOIN public."FormFields" ff ON ff."Id" = a."FormFieldId"
      WHERE a."ResponseId" = r."Id" AND a."DeletedAt" IS NULL AND ff."QuestionId" = current_setting('oryx_repair.question')::uuid))
)::text;
