import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppContext } from "@/store/app";
import {
  Activity,
  Droplets,
  Flame,
  Gauge,
  Heart,
  Moon,
  Shield,
  Thermometer,
  UtensilsCrossed,
} from "lucide-react";
import { useContext, type ComponentType } from "react";
import {
  formatCalculatedAt,
  formatMetricValue,
  friendlyScoreSeverity,
  scaleFillPercent,
  scoreToneFromSeverity,
} from "./intelligenceDisplay";
import type { IntelligenceScore } from "./types";

const toneStyles = {
  good: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  watch: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  attention: {
    badge:
      "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-100",
    dot: "bg-rose-500",
  },
  unknown: {
    badge:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    dot: "bg-gray-400",
  },
} as const;

function scoreIcon(label: string): ComponentType<{ className?: string }> {
  const key = label.toLowerCase();
  if (/heart|cardio|lipid|cholest/.test(key)) return Heart;
  if (/glycem|glucose|metabol|diabet/.test(key)) return Flame;
  if (/liver|hepat|kidney|renal/.test(key)) return Droplets;
  if (/inflam/.test(key)) return Thermometer;
  if (/immune/.test(key)) return Shield;
  if (/sleep/.test(key)) return Moon;
  if (/vitamin|nutrit|diet/.test(key)) return UtensilsCrossed;
  if (/activ|fitness|muscle/.test(key)) return Activity;
  return Gauge;
}

function displayLabel(label: string) {
  return label.replace(/\s*score\s*$/i, "").trim() || label;
}

function ScoreRing({
  percent,
  color,
  gradientId,
}: {
  percent: number;
  color: string;
  gradientId: string;
}) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <div className="relative h-[4.25rem] w-[4.25rem] flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.65" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-600 dark:text-gray-300">
        {Math.round(percent)}%
      </span>
    </div>
  );
}

export default function IntelligenceScoreCard({
  score,
}: {
  score: IntelligenceScore;
}) {
  const { brandInfo } = useContext(AppContext);
  const accent = brandInfo?.primary_color || "#0d9488";
  const accentSoft = brandInfo?.secondary_color || "#14b8a6";
  const fill = scaleFillPercent(score.value, score.scale_min, score.scale_max);
  const rangeLabel =
    score.scale_min != null && score.scale_max != null
      ? `${formatMetricValue(score.scale_min)}–${formatMetricValue(score.scale_max)}`
      : null;
  const calculated = formatCalculatedAt(score.calculated_at);
  const tone = toneStyles[scoreToneFromSeverity(score.severity)];
  const clinicNote = friendlyScoreSeverity(score.severity);
  const Icon = scoreIcon(score.label);
  const title = displayLabel(score.label);
  const ringId = `score-ring-${score.key.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <Card className="ui-rise overflow-hidden border border-gray-200/70 bg-white/95 shadow-md dark:border-gray-700/50 dark:bg-gray-900/95">
      <div
        className="relative px-4 pb-3 pt-4"
        style={{
          background: `linear-gradient(135deg, ${accent}18 0%, ${accentSoft}10 55%, transparent 100%)`,
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{
              background: `linear-gradient(145deg, ${accent}, ${accentSoft})`,
            }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              {title}
            </p>
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              From your clinic · screening only
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex items-end gap-2">
            <p
              className="text-[2.75rem] font-semibold leading-none tracking-tight"
              style={{ color: accent }}
            >
              {formatMetricValue(score.value)}
            </p>
            <p className="pb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              score
            </p>
          </div>
          {fill != null ? (
            <ScoreRing percent={fill} color={accent} gradientId={ringId} />
          ) : null}
        </div>
      </div>

      <CardContent className="space-y-3 px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/40">
            <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
              Scale
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {rangeLabel ?? "Clinic scale"}
            </p>
          </div>
          <div
            className={`flex flex-col justify-center rounded-xl border px-3 py-2.5 ${tone.badge}`}
          >
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium">
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              Status
            </div>
            <p className="text-sm font-semibold leading-snug">
              {clinicNote ?? "Calculated"}
            </p>
          </div>
        </div>

        {score.description ? (
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {score.description}
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            Higher is better. Your clinic uses this for screening, not as a
            diagnosis.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {clinicNote && score.severity && clinicNote !== score.severity ? (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {score.severity}
            </Badge>
          ) : null}
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Higher is better
          </span>
          {calculated ? (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Updated {calculated}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
