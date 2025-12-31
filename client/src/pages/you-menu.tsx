import Application from "@/api/app";
import NotificationApi from "@/api/notification";
import { App as CapacitorApp } from "@capacitor/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CategoryCards, { Biomarker } from "@/components/youMenu/healthSummary";
import { bodySystemSurveys } from "@/data/body-system-surveys";
import { useToast } from "@/hooks/use-toast";
import { subscribe } from "@/lib/event";
import { Capacitor } from "@capacitor/core";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Baby,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Download,
  Droplets,
  Heart,
  HeartPulse,
  Loader2,
  Moon,
  Pill,
  Plus,
  RefreshCw,
  Shield,
  Smartphone,
  Stethoscope,
  Target,
  Thermometer,
  User,
  UtensilsCrossed,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { useLocation } from "wouter";
import { RookAppleHealth, RookSummaries } from "capacitor-rook-sdk";
import { env, resolveBaseUrl } from "@/api/base";
import { formatDate, isColorDark } from "@/help";
import { AppContext } from "@/store/app";

const healthModules = [
  {
    id: "wearable",
    name: "Wearable",
    icon: Activity,
    color: "text-cyan-600",
    path: "/wearable",
  },
  {
    id: "checkups",
    name: "Checkups",
    icon: Stethoscope,
    color: "text-blue-600",
  },
  {
    id: "health-profile",
    name: "Health Profile",
    icon: User,
    color: "text-green-600",
    progress: 20,
  },
  { id: "vitamins", name: "Vitamins", icon: Pill, color: "text-orange-600" },
  { id: "sleep", name: "Sleep", icon: Moon, color: "text-purple-600" },
  { id: "fat-burning", name: "Fat Burning", icon: Zap, color: "text-red-600" },
  { id: "future-mom", name: "Future Mom", icon: Baby, color: "text-pink-600" },
  {
    id: "meal-plan",
    name: "Meal Plan",
    icon: UtensilsCrossed,
    color: "text-yellow-600",
  },
  { id: "fasting", name: "Fasting", icon: Activity, color: "text-indigo-600" },
  {
    id: "post-covid",
    name: "Post-COVID",
    icon: Shield,
    color: "text-teal-600",
  },
];

const surveyIcons = {
  blood: Droplets,
  hormones: Thermometer,
  liver: Heart,
  cardiovascular: Heart,
  urogenital: Droplets,
  immunity: Shield,
  digestion: UtensilsCrossed,
  nerves: Brain,
  respiratory: Wind,
};

// Helper function to format time from seconds/milliseconds to appropriate unit
function formatTime(timeValue: string | number | null | undefined): string {
  if (!timeValue && timeValue !== 0) return "";
  
  // Convert to number if it's a string
  let totalSeconds: number;
  if (typeof timeValue === "string") {
    // Extract number from string
    const match = timeValue.match(/\d+/);
    if (!match) return timeValue;
    totalSeconds = parseInt(match[0], 10);
  } else {
    totalSeconds = Number(timeValue);
  }
  
  // Check if it's a valid number
  if (isNaN(totalSeconds)) return "";
  
  // If number is large (> 1000), assume it's in milliseconds, convert to seconds
  if (totalSeconds > 1000) {
    totalSeconds = Math.floor(totalSeconds / 1000);
  }
  
  // Convert to minutes if >= 60 seconds
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
    } else {
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`;
    }
  }
  
  return `${totalSeconds} ${totalSeconds === 1 ? "second" : "seconds"}`;
}

export default function YouMenu() {
  const { brandInfo, wellnessScore } = useContext(AppContext);
  const [clientInformation, setClientInformation] = useState<{
    show_phenoage: boolean;
    action_plan: number;
    age: number;
    coach_username: [];
    connected_wearable: boolean;
    date_of_birth: string;
    email: string;
    id: string;
    lab_test: number;
    member_since: string;
    name: string;
    pheno_age: number;
    sex: string;
    verified_account: boolean;
  }>();
  const [hasHtmlReport, setHasHtmlReport] = useState(false);
  useEffect(() => {
    Application.getHtmlReport()
      .then(() => {
        setHasHtmlReport(true);
      })
      .catch((err) => {
        if (err.response.status === 404) {
          setHasHtmlReport(false);
        }
      });
  }, []);
  // const { token, notifications } = usePushNotifications();
  // useEffect(() => {
  //   if(Capacitor.isNativePlatform()){
  //     if(token){
  //       NotificationApi.registerToken(token).then((res) => {
  //         // console.log(res);
  //       });
  //     }
  //   }
  // }, [token]);
  const [questionnaires, setQuestionnaires] = useState<
    {
      Estimated_time: string;
      status: string;
      title: string;
      unique_id: string;
      forms_unique_id: string;
    }[]
  >([]);
  const [openIframe, setOpenIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [openedWindow, setOpenedWindow] = useState<Window | null>(null);
  const wasHiddenRef = useRef(false);
  
  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.data?.type === "QUESTIONARY_SUBMITTED") {
        setOpenIframe(false);
        setIframeUrl("");
        setOpenedWindow(null); // Clear opened window state

        handleIframeClosed();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);
  
  const handleIframeClosed = () => {
    handleGetAssignedQuestionaries();
  };

  const resolveQuestionaryUrl = (questionnaire: any) => {
    // if (env == 'test') {
    return `${resolveBaseUrl()}/questionary/${encodedMi}/${questionnaire.unique_id}/${questionnaire.forms_unique_id}`;
    // }
    // return `${resolveBaseUrl()}/questionary/${encodedMi}/${questionnaire.unique_id}`;
  }

  const [biomarkersData, setBiomarkersData] = useState<Biomarker[]>([]);
  const [holisticPlanActionPlan, setHolisticPlanActionPlan] = useState<{
    latest_deep_analysis: string;
    num_of_interventions: number;
    progress: number;
  }>({
    latest_deep_analysis: "",
    num_of_interventions: 0,
    progress: 0,
  });
  const [encodedMi, setEncodedMi] = useState<string>("");
  useEffect(() => {
    setEncodedMi(localStorage.getItem("encoded_mi") || "");
  }, []);

  const handleGetClientInformation = async () => {
    Application.getClientInformation()
      .then((res) => {
        setClientInformation(res.data);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };
  const handleGetBiomarkersData = async () => {
    Application.getBiomarkersData()
      .then((res) => {
        setBiomarkersData(res.data.biomarkers);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      RookAppleHealth.enableBackGroundUpdates();
      RookAppleHealth.enableBackGroundEventsUpdates();
    }
  }, []);  
  const handleGetHolisticPlanActionPlan = async () => {
    Application.getHolisticPlanActionPlan()
      .then((res) => {
        setHolisticPlanActionPlan(res.data);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    handleGetClientInformation();
    handleGetAssignedQuestionaries();
    handleGetBiomarkersData();
    handleGetHolisticPlanActionPlan();
  }, []);
  useEffect(() => {
    const syncSummaries = async () => {
      if(Capacitor.isNativePlatform() ) {
        await RookSummaries.sync({});
      }
    }
    syncSummaries();
  }, []);

  // Auto-scroll to download report button when ?downloadReport is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("downloadReport") === "true") {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        const element = document.getElementById("download-pdf-report-Box");
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 1000);
    }

    CapacitorApp.addListener('appUrlOpen', (urlOpen: { url: string | URL; }) => {
      const url = new URL(urlOpen.url);
      const key = url.searchParams.get('key');
      if (key === 'downloadReport') {
      setTimeout(() => {
        const element = document.getElementById('download-pdf-report-Box');
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 1000);        
      }
    });    
  }, []);

  const [currentView, setCurrentView] = useState<
    | "main"
    | "avatar-edit"
    | "go-plus"
    | "see-all"
    | "health-profile"
    | "checkups"
    | "personalized-checkup"
    | "survey"
    | "deep-analysis"
  >("main");
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [completedSurveys, setCompletedSurveys] = useState<string[]>([]);

  // Questionnaire data
  // const [questionnaires] = useState([
  //   {
  //     title: "Health and Lifestyle Profile",
  //     status: "Done",
  //     unique_id: "3fa0c241c2",
  //     Estimated_time: "15 minutes",
  //   },
  //   {
  //     title: "Mental Wellness Assessment",
  //     status: "Pending",
  //     unique_id: "5bc2d3e4f1",
  //     Estimated_time: "10 minutes",
  //   },
  //   {
  //     title: "Physical Activity Evaluation",
  //     status: "Done",
  //     unique_id: "7d8e9f0a1b",
  //     Estimated_time: "8 minutes",
  //   },
  // ]);
  const [hasRequiredData, setHasRequiredData] = useState(true);
  const [phenotypicAge, setPhenotypicAge] = useState<number | null>(28);
  const [chronologicalAge, setChronologicalAge] = useState(25);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGetAssignedQuestionaries = async () => {
    Application.getAssignedQuestionaries()
      .then((res) => {
        setQuestionnaires(res.data);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res.response.data.detail,
          variant: "destructive",
        });
      });
  };

  // Check if opened window is closed and refetch questionnaires
  // Only check window.closed on web platform, not on mobile (Android/iOS)
  useEffect(() => {
    if (!openedWindow) return;
    
    // Skip window.closed check on native platforms - rely on message listener instead
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const checkWindowClosed = setInterval(() => {
      if (openedWindow.closed) {
        handleGetAssignedQuestionaries();
        setOpenedWindow(null);
        clearInterval(checkWindowClosed);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkWindowClosed);
  }, [openedWindow]);

  // Listen for app state changes and page visibility changes to refresh questionnaires
  // This works even if the window is still open - refreshes when user returns to app
  useEffect(() => {
    if (!openedWindow) return;

    // Handle app state changes for native platforms
    let appStateListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appStateListener = CapacitorApp.addListener('appStateChange', (state) => {
        // When app comes to foreground and we have an opened window, refresh questionnaires
        // This works even if the window is still open
        if (state.isActive && openedWindow) {
          handleGetAssignedQuestionaries();
        }
      });
    }

    // Handle page visibility changes (works for both web and native)
    // This refreshes data when user switches back to the app tab, even if window is still open
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
      } else if (document.visibilityState === 'visible' && wasHiddenRef.current && openedWindow) {
        // User returned to the app - refresh data even if window is still open
        handleGetAssignedQuestionaries();
        wasHiddenRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [openedWindow, handleGetAssignedQuestionaries]);

  const handleUpgrade = () => {
    toast({
      title: "Upgrade to HolistiCare Plus",
      description:
        "Unlock advanced health insights and personalized recommendations.",
    });
  };

  const startSurvey = (surveyId: string) => {
    const survey = bodySystemSurveys.find((s) => s.id === surveyId);
    if (survey && survey.questions.length > 0) {
      setSelectedSurvey(surveyId);
      setCurrentQuestionIndex(0);
      setSurveyAnswers({});
      setCurrentView("survey");
    } else {
      toast({
        title: "Survey coming soon",
        description: `The ${surveyId} survey questions will be available in the next update.`,
      });
    }
  };

  const handleSurveyAnswer = (
    questionId: string,
    answer: string | string[]
  ) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    const survey = bodySystemSurveys.find((s) => s.id === selectedSurvey);
    if (survey && currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Complete survey
      if (selectedSurvey) {
        setCompletedSurveys((prev) => [...prev, selectedSurvey]);
        toast({
          title: "Survey completed!",
          description: `${survey?.name} survey has been completed successfully.`,
        });
      }
      setCurrentView("health-profile");
      setSelectedSurvey(null);
      setCurrentQuestionIndex(0);
      setSurveyAnswers({});
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // For showing health-related cards - using hasRequiredData as indicator
  const hasHealthData = hasRequiredData;
  const [loadingHtmlReport, setLoadingHtmlReport] = useState(false);
  const [htmlReport, setHtmlReport] = useState<string>("");
  const [showHtmlReport, setShowHtmlReport] = useState(false);
  const handleGetHtmlReport = () => {
    if (!holisticPlanActionPlan.latest_deep_analysis) return;

    setLoadingHtmlReport(true);

    Application.getHtmlReport()
      .then((res) => {
        try {
          const blobUrl = res.data.pdf;

          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "HolisticPlanReport";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

        } catch (error: any) {
          console.error("Error downloading file:", error);
        }
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err?.response?.data?.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoadingHtmlReport(false);
      });
  };
  const [loadingViewHtmlReport, setLoadingViewHtmlReport] = useState(false);
  const handleViewHtmlReport = () => {
    if (!holisticPlanActionPlan.latest_deep_analysis) return;

    setLoadingViewHtmlReport(true);

    Application.getHtmlReport()
      .then((res) => {
        try {
          fetch(res.data.html).then(response => response.blob()).then(res => res.text())
          .then(html => {
            const blob = new Blob([html], { type: "text/html" });
            const blobUrl = URL.createObjectURL(blob);
            setHtmlReport(blobUrl);
            setShowHtmlReport(true);
          });          

        } catch (error: any) {
          console.error("Error downloading file:", error);
        }
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err?.response?.data?.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setLoadingViewHtmlReport(false);
        setLoadingHtmlReport(false);
      });
  };

  const renderMainView = () => (
    <div className="space-y-4">
      {showHtmlReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-900 w-[100%] h-[100%] overflow-hidden relative">
           <div className="w-full fixed top-0 bg-white h-10 flex justify-end items-center px-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHtmlReport(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
           </div>
           <iframe src={htmlReport} style={{ width: "100%", height: "calc(100vh - 40px)",marginTop: "40px" }} />
          </div>
        </div>
      )}      
      {/* Age Cards - Prominent Display */}
      <div
        className={`grid gap-3 ${
          clientInformation?.show_phenoage == true
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {clientInformation?.show_phenoage == true && (
          <Card
            className="cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-emerald-50/80 via-white/90 to-teal-50/80 dark:from-emerald-900/30 dark:via-gray-800/70 dark:to-teal-900/30 border-0 shadow-xl backdrop-blur-lg relative overflow-hidden group"
            onClick={() =>
              toast({
                title: "Phenotypic Age",
                description:
                  "Phenotypic Age (PhenoAge) is an estimate of how old your body seems based on health markers—rather than just your chronological age.",
              })
            }
          >
            <CardContent className="p-4 text-center relative z-10 h-full">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-400/5 to-cyan-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-300/20 to-transparent rounded-full blur-2xl"></div>

              <div className="relative">
                {/* Simple icon */}
                <div className="relative mx-auto flex justify-center mb-4">
                  <div
                    className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: `${
                        brandInfo ? brandInfo?.primary_color : undefined
                      }`,
                    }}
                  >
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Age display */}

                <div className="mb-2">
                  <div
                    className="text-4xl font-extralight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent drop-shadow-sm"
                    style={{
                      color: `${
                        brandInfo ? brandInfo?.primary_color : undefined
                      }`,
                    }}
                  >
                    {clientInformation?.pheno_age}
                  </div>
                  <div
                    className="text-sm font-thin text-emerald-700 dark:text-emerald-300 tracking-wide"
                    style={{
                      color: `${
                        brandInfo ? brandInfo?.primary_color : undefined
                      }`,
                    }}
                  >
                    Phenotypic Age
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          className="cursor-pointer  hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-purple-50/80 via-white/90 to-pink-50/80 dark:from-purple-900/30 dark:via-gray-800/70 dark:to-pink-900/30 border-0 shadow-xl backdrop-blur-lg relative overflow-hidden group"
          onClick={() =>
            toast({
              title: "Chronological Age",
              description: "Based on your date of birth",
            })
          }
        >
          <CardContent className="p-4 text-center relative z-10 h-full">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-pink-400/5 to-rose-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-300/20 to-transparent rounded-full blur-xl animate-pulse"></div>

            <div className="relative">
              {/* Age icon */}
              <div className="relative flex justify-center mx-auto mb-4">
                <div
                  className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: `${
                      brandInfo ? brandInfo?.secondary_color : undefined
                    }`,
                  }}
                >
                  <span className="text-2xl">🎂</span>
                </div>
              </div>

              {/* Age display */}
              <div className="mb-2">
                <div
                  className="text-4xl font-extralight bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent drop-shadow-sm"
                  style={{
                    color: `${
                      brandInfo ? brandInfo?.secondary_color : undefined
                    }`,
                  }}
                >
                  {clientInformation?.age}
                </div>
                <div
                  className="text-sm font-thin text-purple-700 dark:text-purple-300 tracking-wide"
                  style={{
                    color: `${
                      brandInfo ? brandInfo?.secondary_color : undefined
                    }`,
                  }}
                >
                  Chronological Age
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Profile CTA if data missing */}
      {!hasRequiredData && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3 text-center">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
              Complete your Health Profile
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-xs mb-3">
              We need your date of birth, height, weight, and some health data
              to calculate your phenotypic age
            </p>
            <Button
              onClick={() => setCurrentView("health-profile")}
              className="bg-blue-600 hover:bg-blue-700 text-sm min-h-[44px]"
            >
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Your Plan Card */}
      {hasHealthData && (
        <Card
          className="cursor-pointer hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-teal-50/50 via-white/50 to-cyan-50/50 dark:from-teal-900/20 dark:via-gray-800/50 dark:to-cyan-900/20 border-0 shadow-xl backdrop-blur-lg"
          onClick={() => setLocation("/plan")}
        >
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-lg"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-thin text-base text-gray-900 dark:text-gray-100 mb-1">
                    Your Plan
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                    Goals, challenges & action plans
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-16 h-16 relative">
                  <svg
                    className="w-16 h-16 transform -rotate-90"
                    viewBox="0 0 64 64"
                  >
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-gray-200/30 dark:text-gray-700/30"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="3"
                      strokeDasharray={`${
                        2 *
                        Math.PI *
                        28 *
                        (holisticPlanActionPlan.progress / 100)
                      } ${2 * Math.PI * 28}`}
                      strokeLinecap="round"
                      className="drop-shadow-sm"
                    />
                    <defs>
                      <linearGradient
                        id="progressGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-thin bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      {holisticPlanActionPlan.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
 {/* wellneess */}
      <Card
  className="w-full  mx-auto rounded-2xl
             bg-white dark:bg-gray-900
             shadow-xl border border-gray-100 dark:border-gray-800"
>
  <CardContent className="p-5">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
          Wellness Dashboard
        </h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          {wellnessScore.latest_date ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Last synced {formatDate(wellnessScore.latest_date)}
            </>
          ):
          (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              waiting for connection
            </>
          )
          }
        </p>
      </div>

      {/* <RefreshCw className="w-4 h-4 text-gray-400" /> */}
    </div>
    {
      wellnessScore.latest_date && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs tracking-wide text-gray-500">SLEEP</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {wellnessScore.scores.filter((el: any) => {
                  return el.name.toLowerCase().includes('sleep');
                })[0]?.score || 0} <span className="text-xs font-normal text-gray-500"></span>
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="text-xs tracking-wide text-gray-500">Activity</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {wellnessScore.scores.filter((el: any) => {
                  return el.name.toLowerCase().includes('activity score');
                })[0]?.score || 0}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs tracking-wide text-gray-500">STRESS</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {wellnessScore.scores.filter((el: any) => {
                  return el.name.toLowerCase().includes('stress score');
                })[0]?.score || 0}
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span className="text-xs tracking-wide text-gray-500">HEART</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {wellnessScore.scores.filter((el: any) => {
                return el.name.toLowerCase().includes('heart health score');
              })[0]?.score || 0}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
            Monitor your daily habits to optimize your recovery and longevity.
          </p>

          {/* CTA */}
          <button
            onClick={() => setLocation("/wearable")}
            className="w-full flex items-center justify-center gap-2
                      bg-emerald-500 hover:bg-emerald-600
                      text-white text-sm font-medium
                      py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )
    }
    {wellnessScore.latest_date == null &&
    <>
    <div className="flex flex-col items-center text-center px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <Activity className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                        bg-white border border-gray-200
                        flex items-center justify-center shadow-sm">
          <Smartphone className="w-4 h-4 text-indigo-500" />
        </div>
      </div>

      {/* Empty text */}
      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Wellness Data
      </h4>

      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        Connect your wearable or health app to start tracking your daily
        recovery and longevity.
      </p>

      {/* CTA */}
      <button
        onClick={() => setLocation("/devices")}
        style={{
          background: `${
            brandInfo ? brandInfo?.primary_color : undefined
          }`,
          color: `${
            brandInfo ? isColorDark(brandInfo?.primary_color||'#000000') ? "white" : "black" : undefined
          }`,
        }}
        className="w-full flex items-center justify-center gap-2
                   text-sm font-medium
                   py-3 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" />
        Connect Device
      </button>
    </div>    
    </>
    }
  </CardContent>
</Card>


      {/* Assigned Questionnaires Section */}
      <Card className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 border-0 shadow-xl backdrop-blur-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-thin flex items-center gap-2">
            <div
              className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center"
              style={{
                background: `${
                  brandInfo ? brandInfo?.secondary_color : undefined
                }`,
              }}
            >
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            Assigned Questionnaires
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {questionnaires.map((questionnaire) => (
              <div
                key={questionnaire.unique_id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      questionnaire.status === "Done"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                        : "bg-gradient-to-br from-orange-500 to-amber-500"
                    }`}
                  >
                    {questionnaire.status === "Done" ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : (
                      <Calendar className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-xs truncate">
                      {questionnaire.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(questionnaire.Estimated_time || "")}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-auto">
                  {questionnaire.status === "Done" ? (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap"
                    >
                      Completed
                    </Badge>
                  ) : (
                    // <Button
                    //   size="sm"
                    //   variant="outline"
                    //   onClick={() => {
                    //     questionnaire.status = "Done";
                    //     setQuestionnaires([...questionnaires]);
                    //     window.open(
                    //       `https://holisticare.vercel.app/questionary/${encodedMi}/${questionnaire.unique_id}/${questionnaire.forms_unique_id}`
                    //     );
                    //   }}
                    //   className="text-xs h-6 px-2 border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 whitespace-nowrap"
                    // >
                    //   Start
                    // </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = resolveQuestionaryUrl(questionnaire);
                        // setIframeUrl(url);
                        // setOpenIframe(true);
                        const newWindow = window.open(url, "_blank");
                        if (newWindow) {
                          setOpenedWindow(newWindow);
                        }
                      }}
                      className="text-xs h-6 px-2 border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20 whitespace-nowrap"
                    >
                      Start
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {openIframe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-900 w-[100%] h-[100%] overflow-hidden relative">
            <button
              onClick={() => {
                setOpenIframe(false);
                setIframeUrl("");
                handleIframeClosed();
              }}
              className="absolute top-3 right-6"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
            <iframe src={iframeUrl} className="w-full h-full border-none" />
          </div>
        </div>
      )}

      {/* Health Summary Card */}
      {hasHealthData && (
        <Card className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 border-0 shadow-xl backdrop-blur-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-thin flex items-center gap-2">
              <div
                className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
                style={{
                  background: `${
                    brandInfo ? brandInfo?.primary_color : undefined
                  }`,
                }}
              >
                <Heart className="w-3 h-3 text-white" />
              </div>
              Health Summary
            </CardTitle>
          </CardHeader>
          <CategoryCards data={biomarkersData} />
        </Card>
      )}

      {/* Latest Deep Analysis Card */}
      {hasHealthData && (
        <Card className="cursor-pointer hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50/50 via-white/50 to-indigo-50/50 dark:from-purple-900/20 dark:via-gray-800/50 dark:to-indigo-900/20 border-0 shadow-xl backdrop-blur-lg">
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 rounded-lg"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  {holisticPlanActionPlan.latest_deep_analysis && (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-thin text-base text-gray-900 dark:text-gray-100">
                        Latest Deep Analysis
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                        Generated{" "}
                        {
                          holisticPlanActionPlan.latest_deep_analysis.split(
                            "T"
                          )[0]
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  {!hasHtmlReport ? (
                    <>
                      <span className="text-xs font-medium">
                        You’ll be able to download the report once it’s ready.
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium">
                        {holisticPlanActionPlan.num_of_interventions}{" "}
                        personalized interventions
                      </span>
                    </>
                  )}
                </div>
              </div>
              {hasHtmlReport && (
                <div className="flex items-center gap-1 ">
                  <Button
                    id="download-pdf-report-Box"
                    className={`w-full   text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm min-h-[44px]`}
                    style={{
                      background: `${
                        brandInfo ? brandInfo?.primary_color : undefined
                      }`,
                      color: `${
                        brandInfo ? isColorDark(brandInfo?.primary_color||'#000000') ? "white" : "black" : undefined
                      }`,
                    }}
                    onClick={handleGetHtmlReport}
                  >
                    {loadingHtmlReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Download Report"
                    )}
                  </Button>

                  <Button
                    id="view-pdf-report-Box"
                    className="w-full    font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-sm min-h-[44px]"
                    style={{
                      background: `${
                        brandInfo ? brandInfo?.secondary_color : undefined
                      }`,
                      color: `${
                        brandInfo ? isColorDark(brandInfo?.secondary_color||'#000000') ? "white" : "black" : undefined
                      }`,
                    }}
                    onClick={handleViewHtmlReport}
                  >
                    {loadingViewHtmlReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "View Report"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );

  const renderDeletedSubscriptionsView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("health-profile")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold ml-3">Subscription Plans</h1>
      </div>

      {/* Plans */}
      <div className="space-y-3">
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 relative">
          <div className="absolute -top-2 left-3">
            <Badge className="bg-orange-500 text-white text-xs">POPULAR</Badge>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  12-Month Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Best value for committed users
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  $199
                </div>
                <div className="text-xs text-gray-500">$16.58/month</div>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">
                  Weekly coaching sessions (bookable)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">
                  Deep Analysis every 3 months (quarterly)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">Priority booking and support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">Unlimited chat with AI copilot</span>
              </div>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm min-h-[44px]">
              Purchase Plan
            </Button>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                12 weekly coaching sessions remaining
              </p>
              <p className="text-xs text-gray-500">
                Next Deep Analysis: March 2025
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  3-Month Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perfect for getting started
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  $79
                </div>
                <div className="text-xs text-gray-500">$26.33/month</div>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">One comprehensive Deep Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">
                  Chat with Copilot & coach booking
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">
                  Full access to educational content
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full text-sm min-h-[44px]">
              Purchase Plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscription Status */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Active Subscription
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                12-month plan • Expires Dec 15, 2025
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Total paid: $199.00
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDeepAnalysisView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("main")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Deep Analysis</h1>
      </div>

      {/* Analysis Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                Comprehensive Health Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get a detailed analysis of your physiological and behavioral
                patterns, with personalized recommendations and a custom action
                plan.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Analysis of all your health data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Personalized action plan generation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Phenotypic age calculation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    Risk assessment and recommendations
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="lg"
        onClick={() => {
          toast({
            title: "Deep Analysis Started",
            description:
              "Your analysis is being generated. This will take a few moments.",
          });
          setTimeout(() => {
            setLocation("/action-plan");
          }, 2000);
        }}
      >
        Generate Deep Analysis
      </Button>

      <p className="text-center text-sm text-gray-500">
        Your personalized action plan will be generated based on your health
        data and goals.
      </p>
    </div>
  );

  const renderHealthProfile = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("main")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold ml-3">Health Profile</h1>
      </div>

      {/* User Avatar and Progress */}
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full border-4 border-blue-200 flex items-center justify-center">
            <Avatar className="w-16 h-16">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback>RZ</AvatarFallback>
            </Avatar>
          </div>
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-600"
            style={{ clipPath: "polygon(0 0, 20% 0, 20% 100%, 0 100%)" }}
          />
        </div>
        <div>
          <h2 className="text-base font-semibold">rezi</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your profile is 20% complete
          </p>
        </div>
      </div>

      {/* Completed Progress */}
      <div className="space-y-2">
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Basic survey complete</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 text-xs"
              >
                +10%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Health app connected</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 text-xs"
              >
                +10%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What to do next */}
      <div>
        <h3 className="text-base font-semibold mb-3">What to do next?</h3>

        {/* Body System Surveys */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              Take the body system surveys
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete detailed health assessments for each body system
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {bodySystemSurveys.map((survey) => {
              const IconComponent =
                surveyIcons[survey.id as keyof typeof surveyIcons];
              return (
                <div
                  key={survey.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{survey.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">+{survey.points}%</Badge>
                    {completedSurveys.includes(survey.id) ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => startSurvey(survey.id)}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Test Cards */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">Take a general blood test</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Screen for infections, inflammation, anemia, and blood
                    diseases
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    +20%
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setCurrentView("checkups")}
                  >
                    View in Checkup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">Take a urinalysis test</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Screen kidney and urinary tract health
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">+15%</Badge>
                  <Button size="sm" onClick={() => setCurrentView("checkups")}>
                    View in Checkup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">Take specialized tests</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customized based on health, genetics, and lifestyle
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">+20%</Badge>
                  <Button size="sm" onClick={() => setCurrentView("checkups")}>
                    View in Checkup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderSurveyView = () => {
    const survey = bodySystemSurveys.find((s) => s.id === selectedSurvey);
    if (!survey || !survey.questions.length) return null;

    const currentQuestion = survey.questions[currentQuestionIndex];
    const currentAnswer =
      surveyAnswers[currentQuestion.id] || currentQuestion.defaultAnswer;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView("health-profile")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{survey.name} Survey</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {survey.questions.length}
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* Progress */}
        <Progress
          value={((currentQuestionIndex + 1) / survey.questions.length) * 100}
          className="mb-6"
        />

        {/* Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === "single" ? (
              <RadioGroup
                value={currentAnswer as string}
                onValueChange={(value) =>
                  handleSurveyAnswer(currentQuestion.id, value)
                }
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option}
                      id={`${currentQuestion.id}-${index}`}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${index}`}
                      className="text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${currentQuestion.id}-${index}`}
                      checked={(currentAnswer as string[])?.includes(option)}
                      onCheckedChange={(checked) => {
                        const currentAnswers =
                          (currentAnswer as string[]) || [];
                        if (checked) {
                          handleSurveyAnswer(currentQuestion.id, [
                            ...currentAnswers,
                            option,
                          ]);
                        } else {
                          handleSurveyAnswer(
                            currentQuestion.id,
                            currentAnswers.filter((a) => a !== option)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${index}`}
                      className="text-sm"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          <Button onClick={nextQuestion}>
            {currentQuestionIndex === survey.questions.length - 1
              ? "Complete Survey"
              : "Next"}
          </Button>
        </div>
      </div>
    );
  };

  const renderCheckupsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("main")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold ml-4">
          Basic checkup for women 18-29 years old
        </h1>
      </div>

      {/* Feature Highlight */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium">
              Free test list based on WHO recommendations
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Helps identify major health risks
          </p>
          <Button variant="link" className="p-0 h-auto text-blue-600">
            Learn more
          </Button>
        </CardContent>
      </Card>

      {/* Personalization Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">
                You can account for 110 personal factors in your checkup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick a test based on your body type
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => setCurrentView("personalized-checkup")}
      >
        Personalize your checkup
      </Button>

      {/* Missing Tests */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Missing tests</h3>
        <div className="space-y-3">
          {[
            "Clinical blood count without leukocyte formula (venous blood)",
            "Biochemical blood test, basic",
            "Urinalysis",
          ].map((test, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{test}</span>
                  <Checkbox />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full mt-4">
          <Download className="w-4 h-4 mr-2" />
          Download list
        </Button>
      </div>
    </div>
  );

  const renderPersonalizedCheckupView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView("checkups")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Personalized Checkup</h1>
      </div>

      {/* Progress */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <User className="w-12 h-12 text-gray-600" />
          </div>
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-600"
            style={{ clipPath: "polygon(0 0, 27% 0, 27% 100%, 0 100%)" }}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Your personalized checkup takes into account
          </h2>
          <p className="text-2xl font-bold text-blue-600">30 of 110 factors</p>
        </div>
      </div>

      {/* Completed Progress */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Basic survey complete</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              +30
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* How to account for more factors */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          How can I account for more factors?
        </h3>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">
              Take the body system surveys
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help identify hidden health risks and guide personalized tests
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {bodySystemSurveys.map((survey) => (
              <div
                key={survey.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="font-medium">{survey.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">+{survey.points}</Badge>
                  {completedSurveys.includes(survey.id) ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => startSurvey(survey.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case "main":
        return renderMainView();
      case "health-profile":
        return renderHealthProfile();
      case "survey":
        return renderSurveyView();
      case "checkups":
        return renderCheckupsView();
      case "personalized-checkup":
        return renderPersonalizedCheckupView();
      case "deep-analysis":
        return renderDeepAnalysisView();
      case "avatar-edit":
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("main")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold ml-4">Avatar Edit</h1>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Choose your appearance
              </p>
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Choose skin colour
                </Button>
                <Button variant="outline" className="w-full">
                  Choose body shape
                </Button>
                <Button onClick={() => setCurrentView("main")}>Done</Button>
              </div>
            </div>
          </div>
        );
      case "go-plus":
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("main")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold ml-4">Try HolistiCare Plus</h1>
            </div>
            <div className="space-y-4">
              <Card className="relative">
                <Badge className="absolute -top-2 left-4 bg-orange-500">
                  POPULAR
                </Badge>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">12 months</h3>
                      <p className="text-sm text-gray-500">$2.30/week</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">$79.99</div>
                      <div className="text-sm text-green-600">Save 33%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">1 month</h3>
                      <p className="text-sm text-gray-500">Cancel anytime</p>
                    </div>
                    <div className="font-bold">$9.99</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Forever (Lifetime)</h3>
                      <p className="text-sm text-gray-500">
                        $1.53/week - Lifetime access
                      </p>
                    </div>
                    <div className="font-bold">$249.99</div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button onClick={handleUpgrade} className="w-full">
                  Continue
                </Button>
                <Button variant="outline" className="w-full">
                  Not sure yet? Enable 1-year intro offer
                </Button>
                <Button variant="ghost" className="w-full text-sm">
                  Restore purchases
                </Button>
              </div>
            </div>
          </div>
        );
      case "see-all":
        return (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("main")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-bold ml-3">All Health Modules</h1>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {healthModules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => module.path && setLocation(module.path)}
                    data-testid={`module-${module.id}`}
                  >
                    <CardContent className="p-3 text-center">
                      <IconComponent
                        className={`w-6 h-6 mx-auto mb-1 ${module.color}`}
                      />
                      <h3 className="font-medium text-xs">{module.name}</h3>
                      {module.progress && (
                        <div className="mt-1">
                          <Progress value={module.progress} className="h-1" />
                          <p className="text-xs text-gray-500 mt-1">
                            {module.progress}% complete
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      default:
        return renderMainView();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 pb-10">
      <div className="max-w-sm mx-auto">{renderCurrentView()}</div>
    </div>
  );
}
