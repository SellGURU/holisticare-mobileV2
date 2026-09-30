import { useIntelligenceSummary } from "@/hooks/useIntelligenceSummary";
import IntelligenceAgeCard from "./IntelligenceAgeCard";
import IntelligenceEmptyState from "./IntelligenceEmptyState";
import IntelligenceScoreCard from "./IntelligenceScoreCard";
import {
  formatCalculatedAt,
  isPhenotypicAgeMetric,
} from "./intelligenceDisplay";

export default function IntelligenceSection({
  hidePhenotypicAge = false,
}: {
  hidePhenotypicAge?: boolean;
}) {
  const { data, isPending, isFetching, isError, refetch } =
    useIntelligenceSummary();
  const scores = data?.scores ?? [];
  const ages = (data?.ages ?? []).filter(
    (age) => !hidePhenotypicAge || !isPhenotypicAgeMetric(age),
  );
  const hasValues = scores.length > 0 || ages.length > 0;
  const status = data?.status ?? "empty";
  const lastUpdated = formatCalculatedAt(data?.calculated_at);

  const showSkeleton = isPending && !hasValues;
  const showPending = status === "pending" && !hasValues;
  const showEmpty = !isPending && !isError && status === "empty" && !hasValues;
  const showError = isError || (status === "error" && !hasValues);

  if (!hasValues && (showSkeleton || showPending || showEmpty || showError)) {
    return (
      <section aria-labelledby="scores-and-age-heading" className="space-y-3">
        <h2 id="scores-and-age-heading" className="sr-only">
          Your scores and age
        </h2>
        {showSkeleton ? <IntelligenceEmptyState kind="loading" /> : null}
        {showPending ? <IntelligenceEmptyState kind="pending" /> : null}
        {showEmpty ? <IntelligenceEmptyState kind="empty" /> : null}
        {showError ? (
          <IntelligenceEmptyState kind="error" onRetry={() => void refetch()} />
        ) : null}
      </section>
    );
  }

  return (
    <section aria-labelledby="scores-and-age-heading" className="space-y-3">
      <div className="px-0.5">
        <h2
          id="scores-and-age-heading"
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          Your scores
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          From your clinic. Screening only, not a diagnosis.
          {lastUpdated ? ` Updated ${lastUpdated}` : ""}
          {isFetching ? " · Refreshing" : ""}
        </p>
      </div>

      {hasValues && status === "pending" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          Updating your scores. Showing the latest values we have.
        </p>
      ) : null}

      {scores.map((score) => (
        <IntelligenceScoreCard key={score.key} score={score} />
      ))}
      {ages.map((age) => (
        <IntelligenceAgeCard key={age.key} age={age} />
      ))}
    </section>
  );
}
