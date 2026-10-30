-- Apply one formula-configuration recipe. Every check the preview made is repeated here under lock,
-- so a definition or answer that changed after the preview is never overwritten.
LOCK TABLE public."Questions", public."QuestionOptions", public."QuestionFormulaDefinitions",
  public."FormFields", public."Responses", public."FormResponses",
  public."ResponseFormulaSubmissionSets", public."ResponseFormulaSnapshots"
  IN SHARE ROW EXCLUSIVE MODE;
DO $repair$
DECLARE
  question_id uuid := current_setting('oryx_repair.question')::uuid;
  actor_id uuid := current_setting('oryx_repair.actor')::uuid;
  allow_closed boolean := current_setting('oryx_repair.allowclosed')::boolean;
  answer_plan jsonb := current_setting('oryx_repair.answers')::jsonb;
  option_id uuid;
  option_count integer;
  before_definition text;
  closed_responses jsonb;
  item jsonb;
  changed integer;
  repair_id uuid := gen_random_uuid();
  answers_before jsonb := '[]';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users u JOIN public.userroles ur ON ur."UserId" = u."Id"
    JOIN public.roles r ON r."Id" = ur."RoleId" AND r."DeletedAt" IS NULL
    JOIN public.roleclaims rc ON rc."RoleId" = r."Id"
    JOIN public."PermissionTypes" pt ON pt."RoleClaimId" = rc."Id"
    WHERE u."Id" = actor_id AND NOT u."IsDisabled" AND u."DeletedAt" IS NULL
      AND rc."ClaimValue" = 'CanEditQuestions' AND pt."Key" = 'CanEditQuestions'
  ) THEN RAISE EXCEPTION 'Active operator requires existing CanEditQuestions permission'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public."Questions" WHERE "Id" = question_id AND "Type" = 10 AND "DeletedAt" IS NULL) THEN
    RAISE EXCEPTION 'Question is missing, deleted or not a formula question';
  END IF;
  IF EXISTS (SELECT 1 FROM public."QuestionFormulaDefinitions" WHERE "QuestionId" = question_id) THEN
    RAISE EXCEPTION 'Question is under formula governance: correct it through a formula revision instead';
  END IF;

  SELECT count(*), min("Id"::text)::uuid INTO option_count, option_id FROM public."QuestionOptions"
    WHERE "QuestionId" = question_id AND "DeletedAt" IS NULL;
  IF option_count <> 1 THEN RAISE EXCEPTION 'Expected exactly one live definition option, found %', option_count; END IF;
  SELECT "Name" INTO before_definition FROM public."QuestionOptions" WHERE "Id" = option_id FOR UPDATE;
  IF encode(sha256(convert_to(coalesce(before_definition, ''), 'UTF8')), 'hex') <> current_setting('oryx_repair.expectedsha') THEN
    RAISE EXCEPTION 'The stored definition changed since the recipe was written; run find again';
  END IF;

  IF EXISTS (SELECT 1 FROM public."Responses" r
    JOIN public."FormFieldRevisions" fr ON fr."FormRevisionId" = r."FormRevisionId"
    JOIN public."FormFieldFormulaConfigurations" c ON c."FormFieldRevisionId" = fr."Id"
    JOIN public."FormFields" ff ON ff."Id" = fr."FormFieldId"
    WHERE ff."QuestionId" = question_id
      AND EXISTS (SELECT 1 FROM public."FormResponses" a WHERE a."ResponseId" = r."Id" AND a."FormFieldId" = ff."Id" AND a."DeletedAt" IS NULL)
  ) THEN RAISE EXCEPTION 'A response runs this question through a governed formula placement; this script does not rebase governed responses'; END IF;

  SELECT coalesce(jsonb_agg(DISTINCT r."Id"), '[]') INTO closed_responses FROM public."Responses" r
    JOIN public."FormResponses" a ON a."ResponseId" = r."Id" AND a."DeletedAt" IS NULL
    JOIN public."FormFields" ff ON ff."Id" = a."FormFieldId" AND ff."QuestionId" = question_id
    WHERE r."CheckedAt" IS NOT NULL OR r."Approved" OR r."Rejected"
      OR EXISTS (SELECT 1 FROM public."ResponseFormulaSubmissionSets" ss WHERE ss."ResponseId" = r."Id");
  IF jsonb_array_length(closed_responses) > 0 AND NOT allow_closed THEN
    RAISE EXCEPTION 'Closed responses answered this question (%); rerun with --allow-closed-responses only after QA agrees', closed_responses;
  END IF;

  UPDATE public."QuestionOptions" SET "Name" = current_setting('oryx_repair.newdefinition'),
    "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id WHERE "Id" = option_id;
  UPDATE public."Questions" SET "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id WHERE "Id" = question_id;

  FOR item IN SELECT * FROM jsonb_array_elements(answer_plan) LOOP
    SELECT answers_before || jsonb_build_array(jsonb_build_object('id', a."Id", 'value', a."Value")) INTO answers_before
      FROM public."FormResponses" a WHERE a."Id" = (item->>'id')::uuid;
    UPDATE public."FormResponses" a SET "Value" = item->>'value', "UpdatedAt" = transaction_timestamp(), "LastUpdatedById" = actor_id
      FROM public."Responses" r, public."FormFields" ff
      WHERE a."Id" = (item->>'id')::uuid AND a."DeletedAt" IS NULL
        AND r."Id" = a."ResponseId" AND r."Id" = (item->>'responseId')::uuid
        AND ff."Id" = a."FormFieldId" AND ff."QuestionId" = question_id
        AND r."CheckedAt" IS NULL AND NOT r."Approved" AND NOT r."Rejected"
        AND NOT EXISTS (SELECT 1 FROM public."ResponseFormulaSubmissionSets" ss WHERE ss."ResponseId" = r."Id")
        AND NOT EXISTS (SELECT 1 FROM public."ResponseFormulaSnapshots" sn WHERE sn."ResponseId" = r."Id")
        AND encode(sha256(convert_to(coalesce(a."Value", ''), 'UTF8')), 'hex') = item->>'sha256';
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'Answer % changed, closed or no longer belongs to this question', item->>'id'; END IF;
  END LOOP;

  IF (SELECT encode(sha256(convert_to("Name", 'UTF8')), 'hex') FROM public."QuestionOptions" WHERE "Id" = option_id)
    <> current_setting('oryx_repair.newsha') THEN RAISE EXCEPTION 'Post-write verification failed'; END IF;

  CREATE TABLE IF NOT EXISTS public."_FormulaConfigRepairs" (
    "Id" uuid PRIMARY KEY, "RepairedAt" timestamptz NOT NULL, "DatabaseUser" text NOT NULL, "ActorId" uuid NOT NULL,
    "QuestionId" uuid NOT NULL, "QuestionOptionId" uuid NOT NULL, "Recipe" jsonb NOT NULL, "Reason" text NOT NULL,
    "DefinitionBefore" text NOT NULL, "DefinitionAfter" text NOT NULL, "AnswersBefore" jsonb NOT NULL, "AnswersAfter" jsonb NOT NULL
  );
  INSERT INTO public."_FormulaConfigRepairs" VALUES (repair_id, transaction_timestamp(), current_user, actor_id, question_id, option_id,
    current_setting('oryx_repair.recipe')::jsonb, current_setting('oryx_repair.reason'), coalesce(before_definition, ''),
    current_setting('oryx_repair.newdefinition'), answers_before, answer_plan);
  RAISE NOTICE '%', jsonb_pretty(jsonb_build_object('repairId', repair_id, 'questionId', question_id, 'questionOptionId', option_id,
    'answersChanged', jsonb_array_length(answer_plan), 'closedResponses', closed_responses));
END $repair$;
