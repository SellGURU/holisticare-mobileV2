import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  describeAgeComparison,
  formatCalculatedAt,
  formatMetricValue,
  friendlyAgeSeverity,
} from "@/components/intelligence/intelligenceDisplay";
import { Cake, Info, Sparkles } from "lucide-react";

type PhenoAgeHighlightCardProps = {
  bodyAge: number | null | undefined;
  calendarAge: number | null | undefined;
  severity?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  updatedAt?: string | null;
  onLearnMore: () => void;
  isLoading?: boolean;
};

const toneStyles = {
  younger: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  older: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  aligned: {
    badge:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100",
    dot: "bg-sky-500",
  },
  unknown: {
    badge:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    dot: "bg-gray-400",
  },
} as const;

export function PhenoAgeHighlightCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200/70 bg-white/95 shadow-md dark:border-gray-700/50 dark:bg-gray-900/95">
      <div className="space-y-4 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <span className="h-11 w-11 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="h-12 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <CardContent className="space-y-3 px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-[4.5rem] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-[4.5rem] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-8 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </CardContent>
    </Card>
  );
}

export default function PhenoAgeHighlightCard({
  bodyAge,
  calendarAge,
  severity,
  primaryColor,
  secondaryColor,
  updatedAt,
  onLearnMore,
  isLoading = false,
}: PhenoAgeHighlightCardProps) {
  if (isLoading) {
    return <PhenoAgeHighlightCardSkeleton />;
  }
  const comparison = describeAgeComparison(bodyAge, calendarAge);
  const tone = toneStyles[comparison.tone];
  const clinicNote = friendlyAgeSeverity(severity);
  const updatedLabel = formatCalculatedAt(updatedAt);
  const accent = primaryColor ?? "#0d9488";
  const accentSoft = secondaryColor ?? "#14b8a6";

  return (
    <Card className="overflow-hidden border border-gray-200/70 bg-white/95 shadow-md dark:border-gray-700/50 dark:bg-gray-900/95">
      <div
        className="relative px-4 pb-3 pt-4"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accentSoft}10 55%, transparent 100%)`,
        }}
      >
        <button
          type="button"
          onClick={onLearnMore}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 shadow-sm transition hover:bg-white dark:bg-gray-800/80 dark:text-gray-300"
          aria-label="What is PhenoAge?"
        >
          <Info className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-10">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ background: `linear-gradient(145deg, ${accent}, ${accentSoft})` }}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              PhenoAge
            </p>
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              From your latest labs · screening only
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <p
            className="text-[2.75rem] font-semibold leading-none tracking-tight"
            style={{ color: accent }}
          >
            {formatMetricValue(bodyAge)}
          </p>
          <p className="pb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            years
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/40">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <Cake className="h-3.5 w-3.5" />
              Calendar age
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {formatMetricValue(calendarAge)}
            </p>
          </div>
          <div
            className={`flex flex-col justify-center rounded-xl border px-3 py-2.5 ${tone.badge}`}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              Compared to birthday
            </div>
            <p className="text-sm font-semibold leading-snug">{comparison.shortLabel}</p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {comparison.detail}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {clinicNote ? (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {clinicNote}
            </Badge>
          ) : null}
          {updatedLabel ? (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Updated {updatedLabel}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
