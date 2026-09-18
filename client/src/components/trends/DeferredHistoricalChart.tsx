import { lazy, Suspense, useEffect, useState } from "react";

const HistoricalChart = lazy(() => import("./HistoricalChart"));

type DeferredHistoricalChartProps = {
  statusBar: unknown;
  dataPoints: unknown[];
  labels: string[];
  dataStatus: string[];
  sources: string[];
  unit: string;
  chartId: string;
  valueType?: string;
  valueKind?: string;
};

function ChartSkeleton() {
  return (
    <div
      className="flex h-[115px] w-full flex-col justify-center gap-2"
      aria-busy="true"
      aria-label="Loading chart"
    >
      <div className="h-[70px] w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/** Mounts the portal history chart after paint, for one biomarker at a time. */
const DeferredHistoricalChart = (props: DeferredHistoricalChartProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let idleId = 0;
    let timeoutId = 0;
    const raf = requestAnimationFrame(() => {
      const arm = () => setReady(true);
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(arm, { timeout: 250 });
      } else {
        timeoutId = window.setTimeout(arm, 0);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [props.chartId]);

  if (!ready) return <ChartSkeleton />;

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HistoricalChart {...(props as any)} />
    </Suspense>
  );
};

export default DeferredHistoricalChart;
