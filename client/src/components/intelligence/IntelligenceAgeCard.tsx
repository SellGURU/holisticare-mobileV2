import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AppContext } from "@/store/app";
import { CalendarDays } from "lucide-react";
import { useContext } from "react";
import {
  formatCalculatedAt,
  formatMetricValue,
  friendlyAgeSeverity,
  isPhenotypicAgeMetric,
} from "./intelligenceDisplay";
import type { IntelligenceAge } from "./types";

const toneStyles = {
  younger: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
    label: "On track",
  },
  older: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100",
    dot: "bg-amber-500",
    label: "Worth watching",
  },
  aligned: {
    badge:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-100",
    dot: "bg-sky-500",
    label: "Aligned",
  },
  unknown: {
    badge:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200",
    dot: "bg-gray-400",
    label: "Estimated",
  },
} as const;

function ageTone(severity: string | null | undefined) {
  const key = String(severity || "").toLowerCase();
  if (key.includes("young") || key.includes("optimal")) return "younger" as const;
  if (key.includes("older") || key.includes("border")) return "older" as const;
  if (key.includes("align") || key.includes("match")) return "aligned" as const;
  return "unknown" as const;
}

export default function IntelligenceAgeCard({
  age,
}: {
  age: IntelligenceAge;
}) {
  const { brandInfo } = useContext(AppContext);
  const accent = brandInfo?.secondary_color || brandInfo?.primary_color || "#4f46e5";
  const accentSoft = brandInfo?.primary_color || "#818cf8";
  const calculated = formatCalculatedAt(age.calculated_at);
  const isBodyAge = isPhenotypicAgeMetric(age);
  const title = isBodyAge ? "PhenoAge" : age.label.replace(/\s*age\s*$/i, "").trim() || age.label;
  const clinicNote = friendlyAgeSeverity(age.severity);
  const tone = toneStyles[ageTone(age.severity)];

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
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              {title}
            </p>
            <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              {isBodyAge
                ? "From your latest labs · screening only"
                : "Estimated from your results · screening only"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <p
            className="text-[2.75rem] font-semibold leading-none tracking-tight"
            style={{ color: accent }}
          >
            {formatMetricValue(age.value)}
          </p>
          <p className="pb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            years
          </p>
        </div>
      </div>

      <CardContent className="space-y-3 px-4 pb-4 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/40">
            <p className="mb-1 text-[11px] text-gray-500 dark:text-gray-400">
              Unit
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Years
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
              {clinicNote ?? tone.label}
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {age.description ||
            (isBodyAge
              ? "An estimate of how old your body seems based on lab markers."
              : "Your clinic uses this age estimate for screening, not as a diagnosis.")}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {clinicNote && age.severity && clinicNote !== age.severity ? (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {age.severity}
            </Badge>
          ) : null}
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
