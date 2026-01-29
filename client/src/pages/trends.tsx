import Application from "@/api/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { LabResult } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Brain,
  CheckCircle,
  Droplets,
  Minus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { resolveAnalyseIcon } from "../help";
import BiomarkerChart from "@/components/trends/biomarkerChart";
import Toggle from "@/components/trends/Toggle";

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
  const { toast } = useToast();
  const [mockBiomarkers, setMochBiomarkers] = useState<Array<any>>([]);
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedBiomarker, setSelectedBiomarker] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("results");
  const [searchQuery, setSearchQuery] = useState("");
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
  useEffect(() => {
    Application.getBiomarkersData().then((res) => {
      setMochBiomarkers(res.data.biomarkers);
    });
  }, []);
  const findMatchingLabel = (obj: any) => {
    const value = parseFloat(obj.values[obj.values.length - 1]); // آخرین مقدار
    const status = obj.status[obj.status.length - 1]; // آخرین استاتوس

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

  const { data: labResults = [] } = useQuery<LabResult[]>({
    queryKey: ["/api/lab-results", { limit: 100 }],
  });

  const toggleCardExpansion = (biomarkerId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [biomarkerId]: !prev[biomarkerId],
    }));
  };

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

  const getStatusBadge = (status: string) => {
    const variants = {
      normal: {
        variant: "default",
        color:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      },
      high: {
        variant: "destructive",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
      low: {
        variant: "secondary",
        color:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      },
      critical: {
        variant: "destructive",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      },
    };
    return variants[status as keyof typeof variants] || variants.normal;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredBiomarkers = useMemo(() => {
    if (!searchQuery) return mockBiomarkers;
    return mockBiomarkers.filter((biomarker) =>
      biomarker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, mockBiomarkers]);
  const [toggleStates, setToggleStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  const handleToggleChange = (biomarkerName: string, value: boolean) => {
    setToggleStates((prevState) => ({
      ...prevState,
      [biomarkerName]: value,
    }));
  };

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
    <div className="min-h-screen pb-8 relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-900/20">
      <div className="w-full max-w-sm mx-auto px-3 py-4 overflow-hidden">
        {/* Your Results Header */}
        <div className="mb-4">
          <h2 className="text-xl font-thin bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-2">
            Your Results
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-3">
            Click on any biomarker to view detailed information
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 z-[1] transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <Input
              placeholder="Search biomarkers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Biomarker Cards - Single Column */}
        <div className="space-y-3">
          {filteredBiomarkers.map((biomarker: any) => {
            const optimalRange = biomarker.chart_bounds.filter(
              (el: any) => el.status == "OptimalRange"
            )[0];
            return (
              <Card
                key={biomarker.name}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer rounded-lg"
                onClick={() => openDetailModal(biomarker)}
              >
                <CardContent className="p-4 flex flex-col items-start w-full">
                  {/* Card Header */}
                  <div className="mb-3 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}
                      >
                        {/* <Droplets color="red"></Droplets> */}
                        <img
                          src={resolveAnalyseIcon(biomarker.subcategory)}
                          className="w-4 h-4"
                        />
                        {/* <Icon className="w-5 h-5 text-white" /> */}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {biomarker.name}
                        </h3>
                        <div className="flex invisible gap-2 justify-end items-center">
                          <div className="text-[12px] font-medium text-[#383838]">
                            Historical Chart
                          </div>
                          <Toggle
                            setChecked={(value: boolean) => {
                              handleToggleChange(biomarker.name, value);
                            }}
                            checked={toggleStates[biomarker.name] || false}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          ></Toggle>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last test:{" "}
                        {new Date(biomarker.date[0]).toLocaleDateString()}
                      </p>
                      <Badge
                        style={{
                          backgroundColor: resolveColor(biomarker.status),
                        }}
                        className={`text-xs flex-shrink-0 px-2 py-1`}
                      >
                        {findMatchingLabel(biomarker)}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full flex justify-between items-center mb-1">
                    {/* Current Value */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {biomarker.values[0].toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {biomarker.unit}
                      </span>
                    </div>

                    {/* Reference Range */}
                    <div className="mb-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Optimal Range
                      </div>
                      <div className="text-sm flex flex-wrap gap-4 font-medium text-gray-700 dark:text-gray-300">
                        {resolveOptimalRangesSelectedBiomarker(biomarker).map(
                          (el: any, index: number) => {
                            return (
                              <div
                                key={el.status}
                                className="flex items-center"
                              >
                                {resolveOptimalRangesSelectedBiomarker(
                                  biomarker
                                ).length -
                                  1 ==
                                  index &&
                                  index != 0 && <div className=" mr-4">-</div>}
                                {resolveOptimalRange(el)}
                                {/* <div className="ml-2"></div> */}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {biomarker.chart_bounds.length > 0 ? (
                    <>
                      <div className="w-full">
                        <BiomarkerChart
                          biomarker={biomarker}
                          isCheced={toggleStates[biomarker.name] || false}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center items-center mt-10 w-full">
                        <div className="flex flex-col items-center justify-center">
                          <img
                            src="/icons/Empty/detailAnalyseEmpty.svg"
                            alt=""
                            className="w-[180px]"
                          />
                          <div className="text-Text-Primary text-center mt-[-30px] text-sm font-medium">
                            No Detailed Analysis Available Yet!
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filteredBiomarkers.length === 0 && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <img
                src="/icons/direct.svg"
                alt="No biomarkers"
                className="w-[60px] mx-auto"
              />
              <div className="text-center text-gray-700 dark:text-gray-400 text-sm">
                No Results Available Yet
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-light text-center text-xs">
                Once your test results are uploaded, you'll see detailed results
                here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Information Modal */}
      {selectedBiomarker && (
        <Dialog
          open={showDetailModal}
          onOpenChange={() => {
            setShowDetailModal(false);
            setActiveTab("results");
          }}
        >
          <DialogContent className="max-w-sm mx- ">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div
                  style={{ color: resolveColor(selectedBiomarker.status[0]) }}
                  className={`w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-lg`}
                >
                  {/* <Droplets></Droplets> */}
                  <img
                    src={resolveAnalyseIcon(selectedBiomarker.subcategory)}
                  />
                </div>
                <div>
                  <DialogTitle className="text-lg font-thin">
                    {selectedBiomarker.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Detailed analysis and recommendations
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-4 h-[60vh] overflow-y-auto"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results" className="text-xs">
                  Results
                </TabsTrigger>
                <TabsTrigger value="improve" className="text-xs">
                  How to Improve
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Current Value Card */}
                  <Card
                    className={`bg-gradient-to-br ${selectedBiomarker.bgColor}`}
                  >
                    <CardContent className="p-4">
                      <h3 className="text-base font-medium mb-3">
                        Current Value
                      </h3>
                      <div className="text-center">
                        <div className="text-3xl font-thin text-gray-900 dark:text-gray-100 mb-2">
                          {selectedBiomarker.values[0].toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedBiomarker.unit}
                        </div>
                        <Badge
                          style={{
                            backgroundColor: resolveColor(
                              selectedBiomarker.status[0]
                            ),
                          }}
                          className="mt-2 text-xs"
                        >
                          {selectedBiomarker.chart_bounds.filter(
                            (el: any) =>
                              el.status == selectedBiomarker.status[0]
                          )[0]?.label != ""
                            ? selectedBiomarker.chart_bounds.filter(
                                (el: any) =>
                                  el.status == selectedBiomarker.status[0]
                              )[0]?.label
                            : selectedBiomarker.status[0].toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reference Range Card */}
                  <Card className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
                    <CardContent className="p-4">
                      <h3 className="text-base font-medium mb-3">
                        Reference Range
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Optimal Range:
                          </span>
                          {resolveOptimalRangesSelectedBiomarker(
                            selectedBiomarker
                          ).length ? (
                            resolveOptimalRangesSelectedBiomarker(
                              selectedBiomarker
                            ).map((el: any, index: number) => {
                              return (
                                <div
                                  key={el.status}
                                  className="flex items-center"
                                >
                                  {resolveOptimalRangesSelectedBiomarker(
                                    selectedBiomarker
                                  ).length -
                                    1 ==
                                    index &&
                                    index != 0 && (
                                      <div className=" mr-4">-</div>
                                    )}
                                  {resolveOptimalRange(el)}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-400">
                              No reference range available yet.
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Last Test:
                          </span>
                          {selectedBiomarker.date?.[0] ? (
                            <span className="text-sm font-medium">
                              {new Date(
                                selectedBiomarker.date[0]
                              ).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No test date available.
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-base font-medium mb-2">
                      About This Biomarker
                    </h3>
                    {selectedBiomarker.more_info ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
                        {selectedBiomarker.more_info}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic text-justify">
                        No description is available for this biomarker yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="improve" className="space-y-3 mt-4">
                <h3 className="text-base font-medium">
                  Recommendations to Improve
                </h3>
                <div className="grid gap-3">
                  <Card className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                        {selectedBiomarker.how_to_improve ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 text-justify">
                            {selectedBiomarker.how_to_improve}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic text-justify">
                            No specific recommendations are available for this
                            biomarker yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-3 mt-4">
                <h3 className="text-base font-medium">AI-Generated Insights</h3>
                <div className="grid gap-3">
                  <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                        {selectedBiomarker.insight ? (
                          <p className="text-sm text-gray-700 dark:text-gray-300 text-justify">
                            {selectedBiomarker.insight}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic text-justify">
                            No AI insights have been generated for this
                            biomarker yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setActiveTab("results");
                }}
                className="text-sm min-h-[44px]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
