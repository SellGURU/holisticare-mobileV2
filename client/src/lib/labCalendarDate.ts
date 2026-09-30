/** Lab test dates are calendar dates, not instants. Never parse YYYY-MM-DD as UTC. */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;

const localDateAtMidnight = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, day);

const fromUtcInstant = (parsed: Date) =>
  localDateAtMidnight(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );

export const parseLabCalendarDate = (value?: unknown): Date | null => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return localDateAtMidnight(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    );
  }
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const parsed = new Date(Number(raw));
    if (Number.isNaN(parsed.getTime())) return null;
    return fromUtcInstant(parsed);
  }

  const iso = raw.match(ISO_DATE_RE);
  if (iso) {
    return localDateAtMidnight(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
    );
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  if (/Z|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return fromUtcInstant(parsed);
  }
  return localDateAtMidnight(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );
};

export const formatLabCalendarDate = (
  value?: unknown,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = parseLabCalendarDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, options);
};
