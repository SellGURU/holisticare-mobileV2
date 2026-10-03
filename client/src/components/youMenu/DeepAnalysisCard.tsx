import { Brain, Download, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isColorDark } from "@/help";

const HERO_CARD =
  "overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm";
const HERO_BODY = "flex min-h-[292px] flex-col justify-between space-y-5 p-5";

export function formatDeepAnalysisDate(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw.split("T")[0] || raw;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DeepAnalysisCardProps = {
  isLoading: boolean;
  hasHealthData: boolean;
  latestDeepAnalysis?: string | null;
  hasHtmlReport: boolean;
  htmlReportDetail?: string;
  interventionCount: number;
  brandPrimary: string;
  isViewing: boolean;
  isDownloading: boolean;
  onView: () => void;
  onDownload: () => void;
};

function AccentBar({ color }: { color: string }) {
  return (
    <div className="h-0.5 w-full" style={{ background: color }} aria-hidden />
  );
}

function HeroIcon({ color }: { color: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50">
      <Brain className="h-6 w-6" style={{ color }} />
    </div>
  );
}

function HeroHeader({
  brandPrimary,
  dateLabel,
}: {
  brandPrimary: string;
  dateLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <HeroIcon color={brandPrimary} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          Latest report
        </p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-950">
          Deep Analysis
        </h2>
        {dateLabel ? (
          <p className="mt-1 text-sm text-gray-500">Generated {dateLabel}</p>
        ) : null}
      </div>
    </div>
  );
}

export function DeepAnalysisCard({
  isLoading,
  hasHealthData,
  latestDeepAnalysis,
  hasHtmlReport,
  htmlReportDetail,
  interventionCount,
  brandPrimary,
  isViewing,
  isDownloading,
  onView,
  onDownload,
}: DeepAnalysisCardProps) {
  const formattedDate = formatDeepAnalysisDate(latestDeepAnalysis);
  const primaryLabelColor = isColorDark(brandPrimary) ? "white" : "black";

  if (isLoading) {
    return (
      <Card id="deep-analysis-section" className={HERO_CARD}>
        <AccentBar color={brandPrimary} />
        <CardContent className={HERO_BODY}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50">
              <Loader2
                className="h-5 w-5 animate-spin"
                style={{ color: brandPrimary }}
              />
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[72px] animate-pulse rounded-xl bg-gray-50" />
            <div className="h-[72px] animate-pulse rounded-xl bg-gray-50" />
          </div>
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-10 animate-pulse rounded-xl bg-gray-50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasHealthData || !latestDeepAnalysis) {
    return (
      <Card id="deep-analysis-section" className={HERO_CARD}>
        <AccentBar color={brandPrimary} />
        <CardContent className={HERO_BODY}>
          <HeroHeader brandPrimary={brandPrimary} />
          <div className="rounded-xl bg-gray-50 px-4 py-5">
            <p className="text-sm font-semibold text-gray-900">
              {hasHealthData
                ? "No Deep Analysis yet"
                : "Health data needed"}
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {hasHealthData
                ? "Your report will appear here after your first Deep Analysis is generated."
                : "Add your health data to generate a personalized Deep Analysis report."}
            </p>
          </div>
          <div className="h-[88px]" aria-hidden />
        </CardContent>
      </Card>
    );
  }

  if (!hasHtmlReport) {
    return (
      <Card id="deep-analysis-section" className={HERO_CARD}>
        <AccentBar color={brandPrimary} />
        <CardContent className={HERO_BODY}>
          <HeroHeader
            brandPrimary={brandPrimary}
            dateLabel={formattedDate || undefined}
          />
          <div className="rounded-xl bg-gray-50 px-4 py-5">
            <p className="text-sm font-semibold text-gray-900">
              Report not ready yet
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {htmlReportDetail ||
                "Your report is still being generated. Please try again shortly."}
            </p>
          </div>
          <div className="h-[88px]" aria-hidden />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="deep-analysis-section" className={HERO_CARD}>
      <AccentBar color={brandPrimary} />
      <CardContent className={HERO_BODY}>
        <HeroHeader
          brandPrimary={brandPrimary}
          dateLabel={formattedDate || undefined}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 px-3 py-3">
            <p className="text-2xl font-semibold tracking-tight text-gray-950">
              {Number(interventionCount) || 0}
            </p>
            <p className="mt-1 text-xs font-medium leading-4 text-gray-500">
              Personalized interventions
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-3">
            <p
              className="text-sm font-semibold"
              style={{ color: brandPrimary }}
            >
              Ready
            </p>
            <p className="mt-1 text-xs font-medium leading-4 text-gray-500">
              Ready to view
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            id="view-pdf-report-Box"
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-none"
            style={{
              background: brandPrimary,
              color: primaryLabelColor,
            }}
            onClick={onView}
            disabled={isViewing}
            aria-label={isViewing ? "Opening report" : "View report"}
          >
            {isViewing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            {isViewing ? "Opening report" : "View report"}
          </Button>
          <Button
            id="download-pdf-report-Box"
            variant="ghost"
            className="h-10 w-full rounded-xl text-sm font-medium"
            style={{ color: brandPrimary }}
            onClick={onDownload}
            disabled={isDownloading}
            aria-label={isDownloading ? "Preparing PDF" : "Download PDF"}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? "Preparing PDF" : "Download PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
