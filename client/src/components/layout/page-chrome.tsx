import { Card, CardContent } from "@/components/ui/card";
import {
  DEFAULT_BRAND_COLOR,
  resolveBrandColors,
} from "@/lib/brandCache";
import { cn } from "@/lib/utils";
import { AppContext } from "@/store/app";
import type { LucideIcon } from "lucide-react";
import { useContext, type ReactNode } from "react";

export { DEFAULT_BRAND_COLOR };

export const PAGE_SHELL =
  "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-[calc(var(--nav-height)+1rem)] dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20";

export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return `rgba(16, 185, 129, ${alpha})`;
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useBrandColors() {
  const { brandInfo } = useContext(AppContext);
  const { primary, secondary } = resolveBrandColors(brandInfo);
  return { primary, secondary, brandInfo };
}

function HeaderIcon({
  icon: Icon,
  color,
  percent,
}: {
  icon: LucideIcon;
  color: string;
  percent?: number;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = percent == null ? 100 : Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
      <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
        style={{ background: color }}
      >
        <Icon className="h-4 w-4" />
      </span>
    </span>
  );
}

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  percent?: number;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  eyebrow,
  subtitle,
  percent,
  action,
  className,
}: PageHeaderProps) {
  const { primary } = useBrandColors();

  return (
    <div className={cn("mb-5 flex items-center gap-3", className)}>
      <HeaderIcon icon={icon} color={primary} percent={percent} />
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: primary }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-semibold leading-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

interface BrandWashCardProps {
  children: ReactNode;
  percent?: number;
  className?: string;
  contentClassName?: string;
  id?: string;
}

export function BrandWashCard({
  children,
  percent = 0,
  className,
  contentClassName,
  id,
}: BrandWashCardProps) {
  const { primary, secondary } = useBrandColors();
  const fill = Math.min(Math.max(percent, 0), 100);

  return (
    <Card
      id={id}
      className={cn(
        "relative overflow-hidden rounded-2xl border-0 bg-white/80 shadow-md dark:bg-gray-800/80",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(
            primary,
            0.06 + (fill / 100) * 0.18
          )} 0%, ${hexToRgba(primary, 0.02)} 70%)`,
        }}
      />
      {fill > 0 && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${fill}%`,
            background: `linear-gradient(90deg, ${hexToRgba(
              primary,
              0.16
            )}, ${hexToRgba(primary, 0.04)})`,
          }}
        />
      )}
      <CardContent className={cn("relative z-10 p-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function BrandProgressBar({ percent }: { percent: number }) {
  const { primary, secondary } = useBrandColors();
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/70 dark:bg-gray-700/80">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(Math.max(percent, 0), 100)}%`,
          background: `linear-gradient(90deg, ${primary}, ${secondary})`,
        }}
      />
    </div>
  );
}
