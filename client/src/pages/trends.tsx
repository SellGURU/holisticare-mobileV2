import Application from "@/api/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Brain,
  CheckCircle,
  ChevronRight,
  FlaskConical,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resolveAnalyseIcon } from "../help";
import BiomarkerChart from "@/components/trends/biomarkerChart";
import DeferredHistoricalChart from "@/components/trends/DeferredHistoricalChart";
import { MarkdownBold } from "@/components/markdown-bold";

// Mock biomarker data for enhanced UI
// const mockBiomarkers = [
//   {
//     id: 'ldl-cholesterol',
//     name: 'LDL Cholesterol',
//     value: 120,
//     unit: 'mg/dL',
//     status: 'normal', // normal, high, low, critical
//     lastTest: '2024-01-15',
//     referenceRange: '< 100',
//     trend: 'improving',
//     trendPercent: -8.5,
//     icon: Heart,
//     color: 'from-red-500 to-pink-500',
//     bgColor: 'from-red-50/80 to-pink-50/60 dark:from-red-900/20 dark:to-pink-900/10',
//     statusColor: 'text-yellow-600',
//     description: 'LDL cholesterol should be less than 100 mg/dL for optimal heart health.',
//     recommendations: [
//       'Follow a Mediterranean-style diet',
//       'Exercise regularly (150 min/week)',
//       'Consider omega-3 supplements',
//       'Reduce saturated fat intake'
//     ],
//     insights: [
//       'Your LDL levels have improved by 8.5% since last month',
//       'Current trend suggests you\'re on track to reach optimal levels',
//       'Continue current lifestyle modifications'
//     ]
//   },
//   {
//     id: 'white-blood-cells',
//     name: 'White Blood Cells',
//     value: 6800,
//     unit: '/µL',
//     status: 'normal',
//     lastTest: '2024-01-10',
//     referenceRange: '4,000-11,000',
//     trend: 'stable',
//     trendPercent: 2.1,
//     icon: Droplets,
//     color: 'from-blue-500 to-cyan-500',
//     bgColor: 'from-blue-50/80 to-cyan-50/60 dark:from-blue-900/20 dark:to-cyan-900/10',
//     statusColor: 'text-emerald-600',
//     description: 'White blood cells help fight infections and diseases.',
//     recommendations: [
//       'Maintain good hygiene practices',
//       'Get adequate sleep (7-9 hours)',
//       'Eat immune-boosting foods',
//       'Manage stress levels'
//     ],
//     insights: [
//       'Your white blood cell count is within healthy range',
//       'Stable levels indicate good immune function',
//       'No immediate concerns detected'
//     ]
//   },
//   {
//     id: 'hdl-cholesterol',
//     name: 'HDL Cholesterol',
//     value: 45,
//     unit: 'mg/dL',
//     status: 'low',
//     lastTest: '2024-01-15',
//     referenceRange: '> 40 (M), > 50 (F)',
//     trend: 'improving',
//     trendPercent: 12.5,
//     icon: Heart,
//     color: 'from-emerald-500 to-teal-500',
//     bgColor: 'from-emerald-50/80 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10',
//     statusColor: 'text-orange-600',
//     description: 'HDL cholesterol helps remove other forms of cholesterol from bloodstream.',
//     recommendations: [
//       'Increase aerobic exercise',
//       'Add healthy fats to diet',
//       'Quit smoking if applicable',
//       'Consider niacin supplements'
//     ],
//     insights: [
//       'HDL levels have improved by 12.5% - great progress!',
//       'Continue current exercise routine',
//       'Consider adding more olive oil and nuts to diet'
//     ]
//   },
//   {
//     id: 'glucose',
//     name: 'Blood Glucose',
//     value: 95,
//     unit: 'mg/dL',
//     status: 'normal',
//     lastTest: '2024-01-12',
//     referenceRange: '70-100',
//     trend: 'stable',
//     trendPercent: -1.2,
//     icon: Activity,
//     color: 'from-purple-500 to-indigo-500',
//     bgColor: 'from-purple-50/80 to-indigo-50/60 dark:from-purple-900/20 dark:to-indigo-900/10',
//     statusColor: 'text-emerald-600',
//     description: 'Fasting blood glucose measures sugar levels in blood.',
//     recommendations: [
//       'Maintain current diet',
//       'Continue regular exercise',
//       'Monitor carbohydrate intake',
//       'Stay hydrated'
//     ],
//     insights: [
//       'Excellent glucose control maintained',
//       'Low diabetes risk based on current levels',
//       'Stable metabolic health indicators'
//     ]
//   },
//   {
//     id: 'creatinine',
//     name: 'Creatinine',
//     value: 1.1,
//     unit: 'mg/dL',
//     status: 'normal',
//     lastTest: '2024-01-08',
//     referenceRange: '0.6-1.2',
//     trend: 'stable',
//     trendPercent: 0.9,
//     icon: Droplets,
//     color: 'from-cyan-500 to-blue-500',
//     bgColor: 'from-cyan-50/80 to-blue-50/60 dark:from-cyan-900/20 dark:to-blue-900/10',
//     statusColor: 'text-emerald-600',
//     description: 'Creatinine levels indicate kidney function.',
//     recommendations: [
//       'Stay well hydrated',
//       'Maintain healthy blood pressure',
//       'Limit protein supplements',
//       'Regular kidney function monitoring'
//     ],
//     insights: [
//       'Kidney function appears normal',
//       'Stable creatinine levels over time',
//       'Continue current health practices'
//     ]
//   },
//   {
//     id: 'free-testosterone',
//     name: 'Free Testosterone',
//     value: 18.5,
//     unit: 'pg/mL',
//     status: 'normal',
//     lastTest: '2024-01-05',
//     referenceRange: '9-30',
//     trend: 'improving',
//     trendPercent: 15.6,
//     icon: Activity,
//     color: 'from-orange-500 to-red-500',
//     bgColor: 'from-orange-50/80 to-red-50/60 dark:from-orange-900/20 dark:to-red-900/10',
//     statusColor: 'text-emerald-600',
//     description: 'Free testosterone affects energy, muscle mass, and mood.',
//     recommendations: [
//       'Maintain strength training',
//       'Get adequate sleep',
//       'Manage stress levels',
//       'Consider zinc supplementation'
//     ],
//     insights: [
//       'Testosterone levels improving by 15.6%',
//       'Good response to lifestyle changes',
//       'Energy and vitality should improve'
//     ]
//   }
// ];

export default function Trends() {
  const [mockBiomarkers, setMochBiomarkers] = useState<Array<any>>([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "focus">("all");
  const resolveColor = (key: string) => {
    if (key == "Needs Focus" || key == "CriticalRange") {
      return "#B2302E";
    }
    if (key == "DiseaseRange") {
      return "#BA5225";
    }
    if (key == "Ok" || key == "BorderlineRange") {
      return "#D8D800";
    }
    if (key == "Good" || key == "HealthyRange") {
      return "#72C13B";
    }
    if (key == "Excellent" || key == "OptimalRange") {
      return "#37B45E";
    }
    return "#FBAD37";
  };
  // values/date/status are newest-first (index 0 = latest), same as portal overview
  const getLatestStatus = (obj: any) => obj?.status?.[0] ?? "";
  useEffect(() => {
    Application.getBiomarkersData().then((res) => {
      setMochBiomarkers(res.data.biomarkers);
    });
  }, []);
  const findMatchingLabel = (obj: any) => {
    const value = parseFloat(obj.values[0]); // latest value (values are newest-first)
    const status = getLatestStatus(obj); // latest status (status[0] with values[0])

    for (const bound of obj.chart_bounds) {
      const low =
        bound.low !== null ? parseFloat(bound.low as string) : -Infinity;
      const high =
        bound.high !== null ? parseFloat(bound.high as string) : Infinity;

      if (value >= low && value <= high && bound.status === status) {
        return bound.label && bound.label.trim() !== ""
          ? bound.label
          : bound.status;
      }
    }

    return status; // اگر چیزی پیدا نشد
  };
  // console.log(data);
  // return data.sort((a: any, b: any) => {
  //   const lowA = parseFloat(a.low ?? '');
  //   const lowB = parseFloat(b.low ?? '');

  //   const aLow = isNaN(lowA) ? -Infinity : lowA;
  //   const bLow = isNaN(lowB) ? -Infinity : lowB;

  //   if (aLow !== bLow) return aLow - bLow;

  //   const highA = parseFloat(a.high ?? '');
  //   const highB = parseFloat(b.high ?? '');

  //   const aHigh = isNaN(highA) ? Infinity : highA;
  //   const bHigh = isNaN(highB) ? Infinity : highB;

  //   return aHigh - bHigh;
  // });

  const openDetailModal = (biomarker: any) => {
    setSelectedBiomarker(biomarker);
    setShowDetailModal(true);
  };
  const resolveOptimalRangesSelectedBiomarker = (biomarker: any) => {
    if (
      biomarker?.chart_bounds?.filter((el: any) => el.status == "OptimalRange")
        .length > 0
    ) {
      return biomarker?.chart_bounds?.filter(
        (el: any) => el.status == "OptimalRange"
      );
    }
    return biomarker?.chart_bounds?.filter(
      (el: any) => el.status == "HealthyRange"
    );
  };

  const summary = useMemo(() => {
    const total = mockBiomarkers.length;
    const needsFocus = mockBiomarkers.filter((b) => b.outofref).length;
    const inRange = total - needsFocus;
    const lastUpdated = mockBiomarkers.reduce<Date | null>((latest, b) => {
      const d = b.date?.[0] ? new Date(b.date[0]) : null;
      if (!d) return latest;
      return !latest || d > latest ? d : latest;
    }, null);
    return { total, needsFocus, inRange, lastUpdated };
  }, [mockBiomarkers]);

  const filteredBiomarkers = useMemo(() => {
    let list = mockBiomarkers;
    if (statusFilter === "focus") {
      list = list.filter((biomarker) => biomarker.outofref);
    }
    if (searchQuery) {
      list = list.filter((biomarker) =>
        biomarker.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [searchQuery, mockBiomarkers, statusFilter]);

  const resolveOptimalRange = (Range: any) => {
    return (
      <>
        {Range?.low == null && "<"}
        {Range?.high == null && ">"}
        {Range?.low ?? ""}
        {Range?.low != null &&
          Range?.high != null &&
          Range?.low !== Range?.high &&
          "-"}
        {Range?.low !== Range?.high && Range?.high}
      </>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 pb-8 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20">
      <div className="mx-auto w-full max-w-md px-4 py-4">
        {/* Page header */}
        <div className="mb-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <FlaskConical className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                Your Results
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Biomarker insights from your latest tests
              </p>
            </div>
          </div>

          {/* Summary card */}
          {summary.total > 0 && (
            <Card className="mb-4 overflow-hidden rounded-2xl border-0 bg-white/80 shadow-md backdrop-blur-sm dark:bg-gray-800/80">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-blue-50/80 px-2 py-2.5 dark:bg-blue-900/20">
                    <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                      {summary.total}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Total
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 px-2 py-2.5 dark:bg-emerald-900/20">
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      {summary.inRange}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      In range
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/80 px-2 py-2.5 dark:bg-amber-900/20">
                    <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                      {summary.needsFocus}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Needs focus
                    </p>
                  </div>
                </div>
                {summary.lastUpdated && (
                  <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    Last updated{" "}
                    {summary.lastUpdated.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search biomarkers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-gray-200/80 bg-white/90 pl-10 pr-4 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700/80 dark:bg-gray-800/90"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-white/80 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              All ({summary.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("focus")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                statusFilter === "focus"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "bg-white/80 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              Needs focus ({summary.needsFocus})
            </button>
          </div>
        </div>

        {/* Biomarker list */}
        <div className="space-y-3">
          {filteredBiomarkers.map((biomarker: any) => (
            <Card
              key={biomarker.name}
              className="cursor-pointer overflow-hidden rounded-2xl border-0 bg-white/90 shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.99] dark:bg-gray-800/90"
              onClick={() => openDetailModal(biomarker)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 shadow-sm dark:bg-gray-700/80">
                    <img
                      src={resolveAnalyseIcon(biomarker.subcategory)}
                      alt=""
                      className="h-5 w-5"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {biomarker.name}
                      </h3>
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {biomarker.date?.[0]
                        ? `Last test · ${new Date(biomarker.date[0]).toLocaleDateString()}`
                        : "No test date"}
                    </p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: resolveColor(getLatestStatus(biomarker)),
                    }}
                    className="flex-shrink-0 border-0 px-2 py-0.5 text-[10px] font-medium text-white"
                  >
                    {findMatchingLabel(biomarker)}
                  </Badge>
                </div>

                <div className="mb-3 flex items-end justify-between gap-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                      {biomarker.values[0]?.toLocaleString?.() ??
                        biomarker.values[0]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {biomarker.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Optimal
                    </p>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {resolveOptimalRangesSelectedBiomarker(biomarker)
                        .map((el: any) => {
                          const parts: string[] = [];
                          if (el.low == null) parts.push("<");
                          if (el.high == null) parts.push(">");
                          if (el.low != null) parts.push(String(el.low));
                          if (
                            el.low != null &&
                            el.high != null &&
                            el.low !== el.high
                          )
                            parts.push("-");
                          if (el.high != null && el.low !== el.high)
                            parts.push(String(el.high));
                          return parts.join("");
                        })
                        .join(" · ") || "—"}
                    </p>
                  </div>
                </div>

                {biomarker.chart_bounds.length > 0 ? (
                  <div className="rounded-xl bg-gray-50/80 p-2 dark:bg-gray-900/30">
                    <BiomarkerChart biomarker={biomarker} isCheced={false} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50/60 py-6 dark:bg-gray-900/20">
                    <img
                      src="/icons/Empty/detailAnalyseEmpty.svg"
                      alt=""
                      className="w-[140px] opacity-80"
                    />
                    <p className="-mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                      No detailed analysis yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredBiomarkers.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-gray-800/40">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                <Activity className="h-8 w-8 text-blue-500/70 dark:text-blue-400/70" />
              </span>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {searchQuery || statusFilter === "focus"
                  ? "No matching results"
                  : "No results yet"}
              </h3>
              <p className="mt-1 max-w-[16rem] text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter === "focus"
                  ? "Try adjusting your search or filter."
                  : "Once your test results are uploaded, you'll see detailed biomarker insights here."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Biomarker detail sheet */}
      {selectedBiomarker && (
        <Sheet
          open={showDetailModal}
          onOpenChange={(open) => {
            setShowDetailModal(open);
            if (!open) setActiveTab("results");
          }}
        >
          <SheetContent
            side="bottom"
            className="mx-auto flex max-h-[88dvh] w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
          >
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            <SheetHeader className="flex-shrink-0 space-y-0 px-5 pb-3 pt-1 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm"
                    style={{
                      backgroundColor: `${resolveColor(getLatestStatus(selectedBiomarker))}22`,
                    }}
                  >
                    <img
                      src={resolveAnalyseIcon(selectedBiomarker.subcategory)}
                      alt=""
                      className="h-5 w-5"
                    />
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selectedBiomarker.name}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                      Detailed analysis and recommendations
                    </SheetDescription>
                  </div>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close"
                    className="h-8 w-8 flex-shrink-0 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 grid h-10 w-full grid-cols-3 rounded-xl bg-gray-100/80 p-1 dark:bg-gray-800/80">
                  <TabsTrigger
                    value="results"
                    className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                  >
                    Results
                  </TabsTrigger>
                  <TabsTrigger
                    value="improve"
                    className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                  >
                    Improve
                  </TabsTrigger>
                  <TabsTrigger
                    value="insights"
                    className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                  >
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="mt-0 space-y-3">
                  <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10">
                    <CardContent className="p-4 text-center">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Current value
                      </p>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedBiomarker.values[0]?.toLocaleString?.() ??
                          selectedBiomarker.values[0]}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedBiomarker.unit}
                      </p>
                      <Badge
                        style={{
                          backgroundColor: resolveColor(
                            getLatestStatus(selectedBiomarker)
                          ),
                        }}
                        className="mt-2 border-0 text-xs text-white"
                      >
                        {selectedBiomarker.chart_bounds.filter(
                          (el: any) =>
                            el.status == getLatestStatus(selectedBiomarker)
                        )[0]?.label != ""
                          ? selectedBiomarker.chart_bounds.filter(
                              (el: any) =>
                                el.status ==
                                getLatestStatus(selectedBiomarker)
                            )[0]?.label
                          : getLatestStatus(selectedBiomarker).toUpperCase()}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 bg-gray-50/80 dark:bg-gray-800/50">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Optimal range
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {resolveOptimalRangesSelectedBiomarker(
                            selectedBiomarker
                          ).length
                            ? resolveOptimalRangesSelectedBiomarker(
                                selectedBiomarker
                              ).map((el: any, index: number) => (
                                <span key={el.status} className="inline-flex">
                                  {index > 0 && <span className="mx-1">-</span>}
                                  {resolveOptimalRange(el)}
                                </span>
                              ))
                            : "Not available"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Last test
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {selectedBiomarker.date?.[0]
                            ? new Date(
                                selectedBiomarker.date[0]
                              ).toLocaleDateString()
                            : "Not available"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {showDetailModal &&
                    activeTab === "results" &&
                    Array.isArray(selectedBiomarker.chart_bounds) &&
                    selectedBiomarker.chart_bounds.length > 0 &&
                    Array.isArray(selectedBiomarker.values) &&
                    selectedBiomarker.values.length > 0 && (
                      <Card className="rounded-2xl border-0 bg-white dark:bg-gray-800/50">
                        <CardContent className="p-4">
                          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Historical Data
                          </h3>
                          <div className="relative min-h-[115px] w-full">
                            <DeferredHistoricalChart
                              chartId={`mobile-${String(
                                selectedBiomarker.name || "biomarker",
                              ).replace(/\s+/g, "-")}`}
                              statusBar={selectedBiomarker.chart_bounds}
                              sources={
                                selectedBiomarker.historical_sources || []
                              }
                              dataStatus={selectedBiomarker.status}
                              dataPoints={[...selectedBiomarker.values]}
                              labels={[...selectedBiomarker.date]}
                              unit={selectedBiomarker.unit}
                              valueType={selectedBiomarker.value_type}
                              valueKind={selectedBiomarker.value_kind}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  <Card className="rounded-2xl border-0">
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                        About this biomarker
                      </h3>
                      {selectedBiomarker.more_info ? (
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                          {selectedBiomarker.more_info}
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-400">
                          No description available yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="improve" className="mt-0 space-y-3">
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10">
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      </span>
                      {selectedBiomarker.how_to_improve ? (
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          <MarkdownBold text={selectedBiomarker.how_to_improve} />
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-400">
                          No recommendations available yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights" className="mt-0 space-y-3">
                  <Card className="rounded-2xl border-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10">
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                        <Brain className="h-3.5 w-3.5 text-white" />
                      </span>
                      {selectedBiomarker.insight ? (
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          <MarkdownBold text={selectedBiomarker.insight} />
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-400">
                          No AI insights generated yet.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
