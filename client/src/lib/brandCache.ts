export const BRAND_INFO_KEY = "brand_info";
export const DEFAULT_BRAND_COLOR = "#10b981";

export type CachedBrandInfo = {
  last_update?: string;
  logo?: string;
  name?: string;
  headline?: string;
  primary_color?: string;
  secondary_color?: string;
  tone?: string;
  focus_area?: string;
};

function colorValue(value?: string | null): string {
  return String(value ?? "").trim();
}

export function readCachedBrandInfo(): CachedBrandInfo | undefined {
  try {
    const raw = localStorage.getItem(BRAND_INFO_KEY);
    return raw ? (JSON.parse(raw) as CachedBrandInfo) : undefined;
  } catch {
    return undefined;
  }
}

export function writeCachedBrandInfo(info: CachedBrandInfo) {
  try {
    localStorage.setItem(BRAND_INFO_KEY, JSON.stringify(info));
  } catch {
    // ignore storage write failures
  }
}

export function brandInfoChanged(
  left?: CachedBrandInfo,
  right?: CachedBrandInfo,
): boolean {
  if (!left || !right) return left !== right;
  return (
    colorValue(left.primary_color) !== colorValue(right.primary_color) ||
    colorValue(left.secondary_color) !== colorValue(right.secondary_color) ||
    String(left.logo ?? "") !== String(right.logo ?? "") ||
    String(left.name ?? "") !== String(right.name ?? "")
  );
}

export function resolveBrandColors(info?: CachedBrandInfo | null) {
  const cached = readCachedBrandInfo();
  const primary =
    colorValue(info?.primary_color) ||
    colorValue(cached?.primary_color) ||
    DEFAULT_BRAND_COLOR;
  const secondary =
    colorValue(info?.secondary_color) ||
    colorValue(cached?.secondary_color) ||
    primary;
  return { primary, secondary };
}

export function applyBrandCssVars(info?: CachedBrandInfo | null) {
  if (typeof document === "undefined") return;
  const { primary, secondary } = resolveBrandColors(info);
  document.documentElement.style.setProperty("--brand-primary", primary);
  document.documentElement.style.setProperty("--brand-secondary", secondary);
}
