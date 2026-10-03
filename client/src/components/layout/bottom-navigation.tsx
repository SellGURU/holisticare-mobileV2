import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Activity,
  BookOpen,
  Sparkles,
  Target,
  User,
  UserRound,
} from "lucide-react";
import { hexToRgba, useBrandColors } from "./page-chrome";
import { AppContext } from "@/store/app";
import { useContext } from "react";

const COACH_PRIMARY = "#10b981";
const COACH_SECONDARY = "#0d9488";

const navItems = [
  { path: "/you", icon: UserRound, label: "You" },
  { path: "/monitor", icon: Activity, label: "Results" },
  { path: "/chat", icon: Sparkles, label: "Copilot", featured: true },
  { path: "/plan", icon: Target, label: "Plan" },
  { path: "/educational", icon: BookOpen, label: "Learn" },
] as const;

function isActivePath(location: string, path: string) {
  if (path === "/chat") {
    return location === "/chat" || location === "/";
  }
  return location === path || location.startsWith(`${path}?`);
}

export default function BottomNavigation() {
  const [location] = useLocation();
  const { primary, secondary } = useBrandColors();
  const { chatMode } = useContext(AppContext);
  const isCoach = chatMode === "coach";
  const featuredLabel = isCoach ? "Coach" : "Copilot";
  const featuredPrimary = isCoach ? COACH_PRIMARY : primary;
  const featuredSecondary = isCoach ? COACH_SECONDARY : secondary;

  return (
    <nav
      data-bottom-nav
      className="sticky bottom-0 z-30 px-3 pt-5"
      style={{
        paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="relative mx-auto flex max-w-lg items-end justify-between rounded-[28px] border border-white/70 bg-white/82 px-1.5 py-1.5 shadow-[0_10px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(location, item.path);
          const featured = "featured" in item && item.featured;

          if (featured) {
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-label={featuredLabel}
                aria-current={isActive ? "page" : undefined}
                className="relative z-10 -mt-6 flex min-w-[4.25rem] flex-col items-center"
              >
                <span
                  className={cn(
                    "nav-copilot-orb ui-press relative flex h-14 w-14 items-center justify-center rounded-full text-white ring-[3px] ring-white transition-all dark:ring-gray-900",
                    isActive && !isCoach && "nav-ai-orb nav-copilot-orb-active scale-105",
                    isActive && isCoach && "scale-105",
                  )}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(160deg, ${hexToRgba(featuredPrimary, 0.95)} 0%, ${featuredPrimary} 42%, ${featuredSecondary} 100%)`,
                          border: `2px solid ${hexToRgba(featuredPrimary, 0.85)}`,
                          boxShadow: [
                            `inset 0 2px 3px rgba(255,255,255,0.5)`,
                            `inset 0 -5px 8px rgba(0,0,0,0.22)`,
                            `0 1px 0 rgba(255,255,255,0.35)`,
                            `0 8px 6px -2px ${hexToRgba(featuredPrimary, 0.28)}`,
                            `0 14px 22px ${hexToRgba(featuredPrimary, 0.32)}`,
                          ].join(", "),
                        }
                      : {
                          background: `linear-gradient(160deg, ${hexToRgba(featuredPrimary, 0.92)} 0%, ${hexToRgba(featuredPrimary, 0.78)} 48%, ${hexToRgba(featuredSecondary, 0.7)} 100%)`,
                          border: `2px solid ${hexToRgba(featuredPrimary, 0.8)}`,
                          boxShadow: [
                            `inset 0 2px 3px rgba(255,255,255,0.4)`,
                            `inset 0 -4px 6px rgba(15,23,42,0.14)`,
                            `0 1px 0 rgba(255,255,255,0.4)`,
                            `0 8px 14px ${hexToRgba(featuredPrimary, 0.28)}`,
                          ].join(", "),
                        }
                  }
                >
                  {!isCoach && (
                    <span className="nav-copilot-globe-clip" aria-hidden>
                      <span className="nav-copilot-globe" />
                      <span className="nav-copilot-globe-light" />
                    </span>
                  )}
                  {isCoach ? (
                    <User
                      className="relative z-10 h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                      strokeWidth={2.1}
                    />
                  ) : (
                    <Sparkles
                      className="relative z-10 h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                      strokeWidth={2.1}
                    />
                  )}
                </span>
                <span
                  className="mt-1 text-[10px] font-semibold tracking-wide"
                  style={{
                    color: isActive
                      ? featuredPrimary
                      : hexToRgba(featuredPrimary, 0.88),
                  }}
                >
                  {featuredLabel}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <span
                className={cn(
                  "ui-press flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1 transition-colors",
                  isActive
                    ? "bg-black/[0.04] dark:bg-white/[0.06]"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] transition-colors",
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                  style={isActive ? { color: primary } : undefined}
                  strokeWidth={isActive ? 2.3 : 1.9}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                  style={isActive ? { color: primary } : undefined}
                >
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
