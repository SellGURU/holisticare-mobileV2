export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const PHENOTYPIC_AGE_NAMES = new Set(["phenoage", "phenotypic age"]);

export function isPhenotypicAgeMetric(metric: {
  key?: string | null;
  label?: string | null;
}): boolean {
  const values = [metric.key, metric.label]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
  return values.some(
    (value) =>
      PHENOTYPIC_AGE_NAMES.has(value) ||
      value.includes("phenoage") ||
      value.includes("phenotypic age"),
  );
}

export function formatMetricValue(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return "—";
  if (Number.isInteger(value)) return String(value);
  return Math.abs(value - Math.round(value)) < 0.05
    ? String(Math.round(value))
    : value.toFixed(1);
}

export function calculateCalendarAge(
  dateOfBirth: string | null | undefined,
  now = new Date(),
): number | null {
  if (!dateOfBirth) return null;
  const match = String(dateOfBirth)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dob = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  if (age < 0 || age > 150) return null;
  return age;
}

export function resolveCalendarAge(
  age: number | null | undefined,
  dateOfBirth: string | null | undefined,
  now = new Date(),
): number | null {
  if (isFiniteNumber(age) && age > 0) return age;
  return calculateCalendarAge(dateOfBirth, now);
}

export function hasValidScale(
  min: number | null | undefined,
  max: number | null | undefined,
): boolean {
  return isFiniteNumber(min) && isFiniteNumber(max) && max > min;
}

/** Visual fill only. Does not infer health status or convert clinical meaning. */
export function scaleFillPercent(
  value: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined,
): number | null {
  if (!isFiniteNumber(value) || !hasValidScale(min, max)) return null;
  const ratio = (value - (min as number)) / ((max as number) - (min as number));
  return Math.max(0, Math.min(100, ratio * 100));
}

export function formatCalculatedAt(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type AgeComparisonTone = "younger" | "older" | "aligned" | "unknown";

export function describeAgeComparison(
  bodyAge: number | null | undefined,
  calendarAge: number | null | undefined,
): {
  tone: AgeComparisonTone;
  deltaYears: number | null;
  shortLabel: string;
  detail: string;
} {
  if (!isFiniteNumber(bodyAge) || !isFiniteNumber(calendarAge)) {
    return {
      tone: "unknown",
      deltaYears: null,
      shortLabel: "Compare with your birthday age",
      detail:
        "We estimate body age from your lab results. Your clinic uses this for screening, not diagnosis.",
    };
  }

  const delta = calendarAge - bodyAge;
  const rounded = Math.round(Math.abs(delta) * 10) / 10;
  const yearsWord = rounded === 1 ? "year" : "years";

  if (Math.abs(delta) < 0.5) {
    return {
      tone: "aligned",
      deltaYears: 0,
      shortLabel: "Matches calendar age",
      detail: "Your estimated body age is close to your age from date of birth.",
    };
  }

  if (delta > 0) {
    return {
      tone: "younger",
      deltaYears: rounded,
      shortLabel: `About ${formatMetricValue(rounded)} ${yearsWord} younger`,
      detail: `Your body age estimate is lower than your calendar age (${formatMetricValue(calendarAge)}).`,
    };
  }

  return {
    tone: "older",
    deltaYears: rounded,
    shortLabel: `About ${formatMetricValue(rounded)} ${yearsWord} higher`,
    detail: `Your body age estimate is above your calendar age (${formatMetricValue(calendarAge)}).`,
  };
}

export function friendlyAgeSeverity(severity: string | null | undefined): string | null {
  const raw = String(severity || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("young") || lower.includes("optimal")) return "On track";
  if (lower.includes("older") || lower.includes("border")) return "Worth watching";
  if (lower.includes("critical") || lower.includes("disease")) return "Talk with your clinic";
  return raw;
}

export type ScoreTone = "good" | "watch" | "attention" | "unknown";

/** Clinic score labels only. Higher is better; does not infer a diagnosis. */
export function scoreToneFromSeverity(
  severity: string | null | undefined,
): ScoreTone {
  const key = String(severity || "").trim().toLowerCase();
  if (!key) return "unknown";
  if (
    key.includes("poor") ||
    key.includes("critical") ||
    key.includes("severe") ||
    key.includes("bad") ||
    /(^|[^a-z])low([^a-z]|$)/.test(key)
  ) {
    return "attention";
  }
  if (
    key.includes("moderat") ||
    key.includes("fair") ||
    key.includes("border") ||
    key.includes("watch") ||
    key.includes("average")
  ) {
    return "watch";
  }
  if (
    key.includes("optimal") ||
    key.includes("excellent") ||
    key.includes("good") ||
    key.includes("great") ||
    /(^|[^a-z])high([^a-z]|$)/.test(key)
  ) {
    return "good";
  }
  return "unknown";
}

export function friendlyScoreSeverity(
  severity: string | null | undefined,
): string | null {
  const raw = String(severity || "").trim();
  if (!raw) return null;
  const tone = scoreToneFromSeverity(raw);
  if (tone === "good") return "On track";
  if (tone === "watch") return "Worth watching";
  if (tone === "attention") return "Talk with your clinic";
  return raw;
}
