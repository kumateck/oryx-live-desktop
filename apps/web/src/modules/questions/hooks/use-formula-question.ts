import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { questionSchema } from "@/shared/form-response/form-model";
import { buildFormulaRevisionDraft } from "@/shared/formula/builder/definition-adapter";
import { FormulaRevisionStatus, governanceApi, type FormulaRevision, type GovernedQuestion } from "@/shared/formula/governance-api";
import { UNIVERSAL_FORMULA_FLUSH_EVENT } from "@/shared/formula/ui/events";
import { FormulaType, formulaTypeName } from "@/shared/questions/question-types";
import { useGetApiV1FormQuestionByQuestionIdQuery } from "../api/questions-api";
import { formulaQuestionRequest, savedMessage, toFormulaValues } from "../lib/formula-question";
import { formulaQuestionPath, questionPermissions, questionsAudit, questionsPath } from "../lib/questions";
import { getFormulaVariableSyntaxError } from "../lib/variable-syntax";
import { formulaDefaults, questionFormulaSchema, type QuestionFormulaValues } from "../schemas/formula-question-schema";

const typeOf = (value: string | undefined): FormulaType => { const number = Number(value); return number === FormulaType.Uniformity || number === FormulaType.Universal ? number : FormulaType.Simple; };

/** A formula question being written: its form, the live Universal definition, and saving it as a governed draft revision. */
export function useFormulaQuestion(questionId: string | null) {
  const navigate = useNavigate();
  const question = useGetApiV1FormQuestionByQuestionIdQuery(questionId ? { ...questionsAudit, questionId } : skipToken);
  const revisions = governanceApi.useGetFormulaRevisionsQuery(questionId ? { ...questionsAudit, questionId } : skipToken);
  const [create, creating] = governanceApi.useCreateGovernedQuestionMutation();
  const [update, updating] = governanceApi.useUpdateGovernedQuestionMutation();
  const permission = usePermissionAction(questionId ? questionPermissions.edit : questionPermissions.create);
  const form = useForm<QuestionFormulaValues>({ resolver: zodResolver(questionFormulaSchema), defaultValues: formulaDefaults, mode: "onChange" });
  const [status, setStatus] = useState<FormulaRevision["status"] | null>(null);
  const [saved, setSaved] = useState<GovernedQuestion | null>(null);
  const [message, setMessage] = useState("");
  const loadedOption = useRef("");
  const universal = useRef("");
  const [universalPayload, setUniversalPayload] = useState("");
  const loaded = useRef(false);
  const parsedQuestion = useMemo(() => { const parsed = questionSchema.safeParse(question.data ?? null); return parsed.success ? parsed.data : null; }, [question.data]);
  useEffect(() => {
    if (!questionId || loaded.current || !parsedQuestion || revisions.isLoading) return;
    loaded.current = true;
    const latest = revisions.data?.[0];
    const authoring = latest?.authoringPayload || parsedQuestion.options[0] || "";
    loadedOption.current = authoring;
    const values = toFormulaValues(parsedQuestion, authoring);
    universal.current = values.expression;
    setStatus(latest?.status ?? null);
    form.reset(values);
  }, [form, parsedQuestion, questionId, revisions.data, revisions.isLoading]);
  const type = typeOf(useWatch({ control: form.control, name: "formulaType" })?.value);
  const expression = useWatch({ control: form.control, name: "expression" });
  const definition = type === FormulaType.Universal ? universalPayload || expression : expression;
  // A definition written for one formula type means nothing to another builder, so changing the type starts it afresh.
  const previousType = useRef(type);
  useEffect(() => {
    if (previousType.current === type) return;
    previousType.current = type;
    if (!loaded.current && questionId) return;
    universal.current = "";
    setUniversalPayload("");
    form.setValue("expression", "", { shouldValidate: false });
  }, [form, questionId, type]);
  const onUniversal = useCallback((value: string) => { universal.current = value; setUniversalPayload(value); }, []);
  const onProblem = useCallback((problem: string) => form.setError("expression", { type: "validate", message: problem }), [form]);

  const submit = form.handleSubmit(async (values) => {
    setMessage("");
    const denied = permission.check();
    if (denied) { setMessage(denied); return; }
    const text = type === FormulaType.Universal && universal.current ? universal.current : values.expression.trim();
    const syntax = getFormulaVariableSyntaxError(text);
    if (syntax) { form.setError("expression", { type: "validate", message: syntax }); return; }
    const request = formulaQuestionRequest(values, text, loadedOption.current);
    const formula = await buildFormulaRevisionDraft(request.options?.[0]?.name ?? text, formulaTypeName(type)).catch((error: unknown) => error instanceof Error ? error.message : "This formula cannot be governed.");
    if (typeof formula === "string") { form.setError("expression", { type: "validate", message: formula }); return; }
    const body = { question: request, formula };
    const result = questionId ? await update({ ...questionsAudit, questionId, body }) : await create({ ...questionsAudit, body });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success(savedMessage(result.data, questionId ? "updated" : "created"));
    setSaved(result.data);
    setStatus(result.data.revision.status);
    loadedOption.current = request.options?.[0]?.name ?? text;
    if (!questionId) void navigate(formulaQuestionPath(result.data.questionId), { replace: true });
  });
  /** The Universal builder keeps its latest edits until asked, so it is asked before the form is checked. */
  const save = (event: FormEvent<HTMLFormElement>) => { if (type === FormulaType.Universal) window.dispatchEvent(new Event(UNIVERSAL_FORMULA_FLUSH_EVENT)); void submit(event); };
  return {
    form, type, definition, preset: formulaTypeName(type), save, saving: creating.isLoading || updating.isLoading, message, saved, onStatus: setStatus, onUniversal, onProblem,
    locked: status === FormulaRevisionStatus.InReview, loading: Boolean(questionId) && (question.isLoading || revisions.isLoading), loadError: question.error ? apiErrorMessage(question.error) : questionId && question.data && !parsedQuestion ? "The server returned a question the app could not read." : null,
    retry: () => { void question.refetch(); void revisions.refetch(); }, back: () => void navigate(questionsPath), title: parsedQuestion?.label ?? null,
  };
}
