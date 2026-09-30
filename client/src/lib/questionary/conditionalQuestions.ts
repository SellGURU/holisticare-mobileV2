import ResolveConditions from "./resolveConditions";

export type QuestionnaireResponse = string | string[] | Record<string, unknown> | null;

export type ConditionalQuestion = {
  hide?: boolean;
  skip_validation?: boolean;
  type?: string;
  response?: QuestionnaireResponse;
  conditions?: unknown[];
  order?: number;
  [key: string]: unknown;
};

export function applyQuestionResponses<T extends ConditionalQuestion>(
  questions: T[],
  responses: Record<number, QuestionnaireResponse | undefined>,
): T[] {
  return questions.map((question, index) => ({
    ...question,
    response: responses[index] ?? question.response ?? "",
  }));
}

export function resolveQuestionnaireState<T extends ConditionalQuestion>(
  questions: T[],
  responses: Record<number, QuestionnaireResponse | undefined>,
): T[] {
  return ResolveConditions(applyQuestionResponses(questions, responses)) as T[];
}

export function isQuestionVisible(question: ConditionalQuestion): boolean {
  return question.hide !== true && question.skip_validation !== true;
}

export function visibleQuestionnaireQuestions<T extends ConditionalQuestion>(
  questions: T[],
): T[] {
  return questions.filter(isQuestionVisible);
}

export function emptyHiddenResponse(question: ConditionalQuestion): QuestionnaireResponse {
  const type = String(question.type || "").toLowerCase();
  if (type === "checkbox") return [];
  if (type === "file uploader") return {};
  return "";
}

export function sanitizeQuestionnaireRespond<T extends ConditionalQuestion>(
  resolvedQuestions: T[],
  responses: Record<number, QuestionnaireResponse | undefined> = {},
): T[] {
  return resolvedQuestions.map((question, index) => {
    if (!isQuestionVisible(question)) {
      return {
        ...question,
        skip_validation: true,
        response: emptyHiddenResponse(question),
      };
    }
    return {
      ...question,
      skip_validation: false,
      response: responses[index] ?? question.response ?? emptyHiddenResponse(question),
    };
  });
}

export function clampQuestionnaireStep({
  step,
  totalVisible,
  showConsent,
}: {
  step: number;
  totalVisible: number;
  showConsent: boolean;
}): number {
  const maxStep = showConsent
    ? Math.max(0, totalVisible)
    : Math.max(0, totalVisible - 1);
  if (!Number.isFinite(step) || step < 0) return 0;
  return Math.min(step, maxStep);
}
