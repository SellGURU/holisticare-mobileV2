export const SCORING_SENTINEL_KEY = "__scoring__";

export function isScoringSentinel(item: unknown): boolean {
  return Boolean(
    item &&
      typeof item === "object" &&
      SCORING_SENTINEL_KEY in (item as Record<string, unknown>),
  );
}

export function fillableQuestions<T>(
  questions: Array<T> | undefined | null,
): Array<T> {
  return (questions || []).filter((item) => !isScoringSentinel(item));
}
