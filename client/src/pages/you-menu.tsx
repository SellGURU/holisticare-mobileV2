import Application from "@/api/app";
import { isPrivateHttpUrl, resolveBaseUrl, resolveMobileReportUrl } from "@/api/base";
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
import { formatDate, isColorDark } from "@/help";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";
import { rewriteHolisticPlanResourceLinks } from "@/lib/patientResourceLinks";
import { sanitizeWellnessReportDisclaimer } from "@/lib/reportDisclaimerSanitize";
import { AppContext } from "@/store/app";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { RookAppleHealth, RookSummaries } from "capacitor-rook-sdk";
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
  Contact2,
  Download,
  Droplets,
  Flame,
  Heart,
  Loader2,
  Moon,
  Pill,
  Plus,
  Shield,
  Smartphone,
  Star,
  Stethoscope,
  Target,
  Thermometer,
  User,
  UtensilsCrossed,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { subscribe, unsubscribe } from "@/lib/event";
import { useLocation } from "wouter";
import { openExternalUrl } from "@/lib/open-external-url";

type WellnessScoreItem = {
  name?: string;
  score?: number | string | null;
};

type WellnessMetricCard = {
  key: string;
  label: string;
  icon: typeof Activity;
  color: string;
  bg: string;
  score: number;
};

const resolveWellnessMetricVisual = (
  name: string,
): Omit<WellnessMetricCard, "key" | "score"> => {
  const n = name.toLowerCase();
  if (n.includes("sleep")) {
    return {
      label: "Sleep",
      icon: Moon,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    };
  }
  if (n.includes("activity") || n.includes("steps")) {
    return {
      label: "Activity",
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    };
  }
  if (n.includes("stress")) {
    return {
      label: "Stress",
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    };
  }
  if (n.includes("heart") || n.includes("cardio") || n.includes("physical")) {
    return {
      label: "Heart",
      icon: Heart,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    };
  }
  if (n.includes("calor") || n.includes("metabolic")) {
    return {
      label: "Calories",
      icon: Flame,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
    };
  }
  if (n.includes("body") || n.includes("composition")) {
    return {
      label: "Body",
      icon: User,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    };
  }
  if (n.includes("readiness")) {
    return {
      label: "Readiness",
      icon: Target,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    };
  }
  if (n.includes("global") || n.includes("wellness") || n.includes("overall")) {
    return {
      label: "Global",
      icon: Star,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-50 dark:bg-slate-800/50",
    };
  }
  const label = name
    .replace(/_/g, " ")
    .replace(/\bscore\b/gi, "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    label: label || "Score",
    icon: Activity,
    color: "text-gray-600 dark:text-gray-300",
    bg: "bg-gray-50 dark:bg-gray-800/50",
  };
};

const buildWellnessMetricCards = (
  scores: WellnessScoreItem[] | undefined,
): WellnessMetricCard[] => {
  const cards: WellnessMetricCard[] = [];
  for (const item of scores || []) {
    const name = String(item?.name || "").trim();
    if (!name || name.toLowerCase().includes("archetype")) continue;
    if (item?.score === null || item?.score === undefined || item?.score === "") {
      continue;
    }
    const numericScore = Number(item.score);
    if (Number.isNaN(numericScore)) continue;
    const visual = resolveWellnessMetricVisual(name);
    cards.push({
      key: name,
      ...visual,
      score: numericScore,
    });
  }
  return cards;
};

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
      return `${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      } ${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`;
    }
  }

  return `${totalSeconds} ${totalSeconds === 1 ? "second" : "seconds"}`;
}

export default function YouMenu() {
  const { brandInfo, wellnessScore } = useContext(AppContext);
  const wellnessMetricCards = useMemo(
    () => buildWellnessMetricCards(wellnessScore?.scores),
    [wellnessScore?.scores],
  );
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
  const [htmlReportUrls, setHtmlReportUrls] = useState<{
    html: string;
    pdf: string;
  } | null>(null);
  const [checkingHtmlReport, setCheckingHtmlReport] = useState(true);

  const isValidReportUrl = (url: unknown): url is string =>
    typeof url === "string" && url.trim().length > 0;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshHtmlReport = async () => {
    setCheckingHtmlReport(true);
    try {
      const res = await Application.getHtmlReport();
      if (!isMountedRef.current) return;
        const html = res?.data?.html;
        const pdf = res?.data?.pdf;
        // Only treat as available when both usable URLs exist (API can 200 with empty links)
        if (isValidReportUrl(html) && isValidReportUrl(pdf)) {
          setHasHtmlReport(true);
          setHtmlReportUrls({
            html: resolveMobileReportUrl(html.trim()),
            pdf: resolveMobileReportUrl(pdf.trim()),
          });
      } else {
        setHasHtmlReport(false);
        setHtmlReportUrls(null);
      }
    } catch {
      if (!isMountedRef.current) return;
      setHasHtmlReport(false);
      setHtmlReportUrls(null);
    } finally {
      if (isMountedRef.current) setCheckingHtmlReport(false);
    }
  };

  useEffect(() => {
    void refreshHtmlReport();
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
    return `${resolveBaseUrl()}/questionary/${encodedMi}/${
      questionnaire.unique_id
    }/${questionnaire.forms_unique_id}`;
    // }
    // return `${resolveBaseUrl()}/questionary/${encodedMi}/${questionnaire.unique_id}`;
  };

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
          description: getErrorMessage(res),
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
          description: getErrorMessage(res),
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
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
          description: getErrorMessage(res),
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
      if (Capacitor.isNativePlatform()) {
        await RookSummaries.sync({});
      }
    };
    syncSummaries();
  }, []);

  const scrollToDeepAnalysis = (delay = 600) => {
    setTimeout(() => {
      const element =
        document.getElementById("download-pdf-report-Box") ??
        document.getElementById("deep-analysis-section");
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, delay);
  };

  // Jump to the Deep Analysis card with fresh data (notification tap / deep link)
  const openDeepAnalysisSection = async () => {
    setCurrentView("main");
    handleGetHolisticPlanActionPlan();
    await refreshHtmlReport();
    scrollToDeepAnalysis();
  };

  useEffect(() => {
    const handleOpenHealthReport = () => {
      void openDeepAnalysisSection();
    };
    const handleHealthReportUpdated = () => {
      handleGetHolisticPlanActionPlan();
      void refreshHtmlReport();
    };

    subscribe("openHealthReport", handleOpenHealthReport);
    subscribe("healthReportUpdated", handleHealthReportUpdated);

    return () => {
      unsubscribe("openHealthReport", handleOpenHealthReport);
      unsubscribe("healthReportUpdated", handleHealthReportUpdated);
    };
  }, []);

  // Auto-scroll to the report when ?downloadReport / ?openReport is in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("downloadReport") === "true" ||
      urlParams.get("openReport") === "1"
    ) {
      // Drop the flag so going back to this page later doesn't jump again
      window.history.replaceState({}, "", window.location.pathname);
      void openDeepAnalysisSection();
    }

    CapacitorApp.addListener("appUrlOpen", (urlOpen: { url: string | URL }) => {
      const url = new URL(urlOpen.url);
      const key = url.searchParams.get("key");
      if (key === "downloadReport" || key === "openReport") {
        void openDeepAnalysisSection();
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
          description: getErrorMessage(res),
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
      appStateListener = CapacitorApp.addListener("appStateChange", (state) => {
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
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
      } else if (
        document.visibilityState === "visible" &&
        wasHiddenRef.current &&
        openedWindow
      ) {
        // User returned to the app - refresh data even if window is still open
        handleGetAssignedQuestionaries();
        wasHiddenRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    answer: string | string[],
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
  const [htmlReportDoc, setHtmlReportDoc] = useState("");
  const [showHtmlReport, setShowHtmlReport] = useState(false);

  const withBaseHref = (html: string, resourceUrl: string) => {
    try {
      const baseHref = new URL(".", resourceUrl).toString();
      if (/<\s*base\s/i.test(html)) return html;
      if (/<\s*head[^>]*>/i.test(html)) {
        return html.replace(/<\s*head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
      }
      return `<base href="${baseHref}">${html}`;
    } catch {
      return html;
    }
  };

  const handleGetHtmlReport = async () => {
    if (!holisticPlanActionPlan.latest_deep_analysis || !hasHtmlReport) return;

    setLoadingHtmlReport(true);
    try {
      const res = await Application.getHtmlReport();
      const pdfUrl = resolveMobileReportUrl(
        (isValidReportUrl(res?.data?.pdf) && res.data.pdf.trim()) ||
          htmlReportUrls?.pdf ||
          ""
      );
      if (!pdfUrl) {
        setHasHtmlReport(false);
        setHtmlReportUrls(null);
        throw new Error("PDF report is not available yet.");
      }

      const htmlUrl = resolveMobileReportUrl(
        (isValidReportUrl(res?.data?.html) && res.data.html.trim()) ||
          htmlReportUrls?.html ||
          ""
      );
      const fallbackPdfUrl = htmlUrl
        ? htmlUrl.replace(/\/html(\?|$)/, "/pdf$1")
        : "";

      const pageIsPrivate =
        typeof window !== "undefined" &&
        isPrivateHttpUrl(`http://${window.location.hostname}`);

      let response: Response | null = null;
      for (const url of [pdfUrl, fallbackPdfUrl]) {
        if (!url) continue;
        if (isPrivateHttpUrl(url) && !pageIsPrivate) continue;
        try {
          const next = await fetch(url);
          if (next.ok) {
            response = next;
            break;
          }
        } catch {
          // Signed Azure URLs can fail in the browser; try the API copy next.
        }
      }
      if (!response) {
        throw new Error("Failed to fetch the PDF report.");
      }

      const blob = await response.blob();
      const pdfBlob =
        blob.type && blob.type !== "application/octet-stream"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      const fileName = "HolisticPlanReport.pdf";

      // Share sheet only on the native app. In the desktop/mobile browser it
      // swallows the click (or looks like nothing happened) instead of saving.
      if (Capacitor.isNativePlatform()) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (
          typeof navigator !== "undefined" &&
          typeof navigator.share === "function" &&
          (!navigator.canShare || navigator.canShare({ files: [file] }))
        ) {
          try {
            await navigator.share({
              files: [file],
              title: "Holistic Plan Report",
            });
            return;
          } catch (shareError: any) {
            if (shareError?.name === "AbortError") return;
          }
        }
        const opened = window.open(pdfUrl, "_blank");
        if (!opened) {
          throw new Error("Popup blocked while opening the PDF.");
        }
        toast({
          title: "PDF opened",
          description: "Use the browser/share menu to save the report to your device.",
        });
        return;
      }

      const objectUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Download failed",
        description:
          error?.response?.data?.detail ||
          error?.message ||
          "Could not download the report on this device.",
        variant: "destructive",
      });
    } finally {
      setLoadingHtmlReport(false);
    }
  };

  const [loadingViewHtmlReport, setLoadingViewHtmlReport] = useState(false);

  // Handle browser back button to close modal
  useEffect(() => {
    const handlePopState = () => {
      if (showHtmlReport) {
        setShowHtmlReport(false);
        setHtmlReportDoc("");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showHtmlReport]);

  const handleViewHtmlReport = async () => {
    if (!holisticPlanActionPlan.latest_deep_analysis || !hasHtmlReport) return;

    setLoadingViewHtmlReport(true);
    try {
      const res = await Application.getHtmlReport();
      const htmlUrl = resolveMobileReportUrl(
        (isValidReportUrl(res?.data?.html) && res.data.html.trim()) ||
          htmlReportUrls?.html ||
          ""
      );
      if (!htmlUrl) {
        setHasHtmlReport(false);
        setHtmlReportUrls(null);
        throw new Error("HTML report is not available yet.");
      }
      const pageIsPrivate =
        typeof window !== "undefined" &&
        isPrivateHttpUrl(`http://${window.location.hostname}`);
      if (isPrivateHttpUrl(htmlUrl) && !pageIsPrivate) {
        throw new Error("HTML report is not available yet.");
      }

      const response = await fetch(htmlUrl);
      if (!response.ok) {
        throw new Error("Failed to load the HTML report.");
      }

      const rawHtml = await response.text();
      if (!rawHtml.trim()) {
        throw new Error("Report content is empty.");
      }

      const patientSafeHtml = rewriteHolisticPlanResourceLinks(
        sanitizeWellnessReportDisclaimer(rawHtml),
      );
      const isSanitizedProxy = htmlUrl.includes("/mobile/html_report/html");
      setHtmlReportDoc(
        isSanitizedProxy ? patientSafeHtml : withBaseHref(patientSafeHtml, htmlUrl),
      );
      setShowHtmlReport(true);
      window.history.pushState({ viewReport: true }, "", "#viewReport");
    } catch (error: any) {
      console.error("Error viewing report:", error);
      toast({
        title: "Unable to open report",
        description:
          error?.response?.data?.detail ||
          error?.message ||
          "Could not open the report on this device.",
        variant: "destructive",
      });
    } finally {
      setLoadingViewHtmlReport(false);
    }
  };

  const handleCloseHtmlReport = () => {
    setHtmlReportDoc("");
    setShowHtmlReport(false);
    // Remove hash from URL without navigating
    if (window.location.hash === "#viewReport") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  };

  const renderMainView = () => (
    <div className="space-y-5">
      {showHtmlReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-900 w-[100%] h-[100%] overflow-hidden relative">
            <div className="w-full fixed top-0 bg-white h-10 flex justify-end items-center px-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseHtmlReport}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <iframe
              srcDoc={htmlReportDoc}
              title="Holistic Plan Report"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              style={{
                width: "100%",
                height: "calc(100vh - 40px)",
                marginTop: "40px",
                border: "none",
                background: "white",
              }}
            />
          </div>
        </div>
      )}
      {/* Age stats */}
      <div
        className={`grid gap-3 ${
          clientInformation?.show_phenoage === true ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {clientInformation?.show_phenoage === true && (
          <button
            type="button"
            onClick={() =>
              toast({
                title: "Phenotypic Age",
                description:
                  "Phenotypic Age (PhenoAge) is an estimate of how old your body seems based on health markers—rather than just your chronological age.",
              })
            }
            className="flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/90 p-4 text-left shadow-sm transition-all active:scale-[0.99] dark:border-gray-700/50 dark:bg-gray-900/90"
          >
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{
                background: brandInfo?.primary_color ?? "#10b981",
              }}
            >
              <Activity className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p
                className="text-2xl font-semibold leading-none text-gray-900 dark:text-gray-100"
                style={{ color: brandInfo?.primary_color }}
              >
                {clientInformation?.pheno_age}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Phenotypic Age
              </p>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            toast({
              title: "Chronological Age",
              description: "Based on your date of birth",
            })
          }
          className="flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/90 p-4 text-left shadow-sm transition-all active:scale-[0.99] dark:border-gray-700/50 dark:bg-gray-900/90"
        >
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
            style={{
              background: brandInfo?.secondary_color ?? "#a855f7",
            }}
          >
            🎂
          </span>
          <div className="min-w-0">
            <p
              className="text-2xl font-semibold leading-none text-gray-900 dark:text-gray-100"
              style={{ color: brandInfo?.secondary_color }}
            >
              {clientInformation?.age}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Chronological Age
            </p>
          </div>
        </button>
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

      {brandInfo?.name === "Default Clinic" && (
        <Card className="overflow-hidden border border-red-200/60 bg-white/90 shadow-sm dark:border-red-900/40 dark:bg-gray-900/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                  <Contact2 className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Contact Us
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Not a clinical member? Get in touch with our team.
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                className="h-9 w-9 flex-shrink-0 rounded-full bg-red-500 hover:bg-red-600"
                onClick={() => void openExternalUrl("https://holisticare.io/#form")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Plan */}
      <Card
        className={`overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90 ${
          hasHealthData ? "cursor-pointer transition-all active:scale-[0.99]" : ""
        }`}
        onClick={hasHealthData ? () => setLocation("/plan") : undefined}
      >
        <CardContent className="p-4">
          {!hasHealthData ? (
            <div className="flex flex-col items-center px-2 py-4 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40">
                <Target className="h-7 w-7 text-teal-600 dark:text-teal-400" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                No Action Plan Yet
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Complete your health profile to get personalized goals and action
                plans.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-sm">
                  <Target className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Your Plan
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Goals, challenges & action plans
                  </p>
                </div>
              </div>
              <div className="relative h-14 w-14 flex-shrink-0">
                <svg
                  className="h-14 w-14 -rotate-90 transform"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#planProgress)"
                    strokeWidth="3"
                    strokeDasharray={`${
                      2 * Math.PI * 28 * (holisticPlanActionPlan.progress / 100)
                    } ${2 * Math.PI * 28}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="planProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {holisticPlanActionPlan.progress}%
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wellness Dashboard */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90">
        <CardContent className="p-4">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Wellness Dashboard
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    wellnessScore.latest_date ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                />
                {wellnessScore.latest_date
                  ? `Synced ${formatDate(wellnessScore.latest_date)}`
                  : "Waiting for connection"}
              </p>
            </div>
          </div>
          {wellnessScore.latest_date && (
            <>
              {wellnessMetricCards.length > 0 ? (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {wellnessMetricCards.map((metric) => (
                    <div
                      key={metric.key}
                      className={`rounded-xl p-3 ${metric.bg}`}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <metric.icon
                          className={`h-3.5 w-3.5 ${metric.color}`}
                        />
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          {metric.label}
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {metric.score}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Sync completed, but no score metrics are available yet.
                </p>
              )}

              <Button
                onClick={() => setLocation("/wearable")}
                className="h-11 w-full rounded-xl font-medium text-white shadow-sm"
                style={{
                  background: brandInfo?.primary_color ?? "#10b981",
                  color: brandInfo
                    ? isColorDark(brandInfo.primary_color || "#000000")
                      ? "white"
                      : "black"
                    : "white",
                }}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {!wellnessScore.latest_date && (
            <div className="flex flex-col items-center px-2 py-2 text-center">
              <div className="relative mb-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                  <Activity className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-white dark:bg-gray-900 dark:ring-gray-900">
                  <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                </span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                No Wellness Data
              </h4>
              <p className="mt-1 mb-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Connect your wearable to track recovery and longevity metrics.
              </p>
              <Button
                onClick={() => setLocation("/devices")}
                className="h-11 w-full rounded-xl font-medium text-white shadow-sm"
                style={{
                  background: brandInfo?.primary_color ?? "#10b981",
                  color: brandInfo
                    ? isColorDark(brandInfo.primary_color || "#000000")
                      ? "white"
                      : "black"
                    : "white",
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Connect Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Questionnaires */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm"
              style={{
                background: brandInfo?.secondary_color ?? "#8b5cf6",
              }}
            >
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </span>
            Assigned Questionnaires
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {questionnaires.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40">
                <BookOpen className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                No Questionnaires Assigned
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Your coach may assign questionnaires to better understand your
                health.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {questionnaires.map((questionnaire) => (
                <div
                  key={questionnaire.unique_id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50/80 px-3 py-2.5 dark:bg-gray-800/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        questionnaire.status === "Done"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    >
                      {questionnaire.status === "Done" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5 text-white" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                        {questionnaire.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {formatTime(questionnaire.Estimated_time || "")}
                      </p>
                    </div>
                  </div>
                  {questionnaire.status === "Done" ? (
                    <Badge className="flex-shrink-0 border-0 bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Done
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = resolveQuestionaryUrl(questionnaire);
                        void openExternalUrl(url).then(() => {
                          // Track return-to-app refresh for native Browser sessions
                          setOpenedWindow({ closed: false } as Window);
                        });
                      }}
                      className="h-7 flex-shrink-0 rounded-lg border-violet-200 px-2.5 text-[11px] text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30"
                    >
                      Start
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
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

      {/* Health Summary */}
      <Card className="overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm"
              style={{
                background: brandInfo?.primary_color ?? undefined,
              }}
            >
              <Heart className="h-3.5 w-3.5 text-white" />
            </span>
            Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!hasHealthData || biomarkersData.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                <Heart className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                No Health Summary
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Connect lab data to see your biomarkers summary.
              </p>
            </div>
          ) : (
            <CategoryCards data={biomarkersData} />
          )}
        </CardContent>
      </Card>

      {/* Deep Analysis */}
      <Card
        id="deep-analysis-section"
        className="overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90"
      >
        <CardContent className="p-4">
          {checkingHtmlReport ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            </div>
          ) : !hasHealthData ||
            !holisticPlanActionPlan.latest_deep_analysis ||
            !hasHtmlReport ? (
            <div className="flex flex-col items-center px-2 py-4 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-950/40">
                <Brain className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {!hasHealthData || !holisticPlanActionPlan.latest_deep_analysis
                  ? "No Deep Analysis Yet"
                  : "Report Not Ready Yet"}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {!hasHealthData || !holisticPlanActionPlan.latest_deep_analysis
                  ? "Add health data to generate your first personalized deep analysis."
                  : "Your deep analysis exists, but the downloadable report is not available yet."}
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-sm">
                  <Brain className="h-5 w-5 text-white" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Latest Deep Analysis
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generated{" "}
                    {holisticPlanActionPlan.latest_deep_analysis.split("T")[0]}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-xl bg-blue-50/80 px-3 py-2 dark:bg-blue-950/30">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {`${holisticPlanActionPlan.num_of_interventions} personalized interventions`}
                </span>
              </div>

              <div className="flex gap-2">
                  <Button
                    id="download-pdf-report-Box"
                    className="h-10 flex-1 rounded-xl text-sm font-medium text-white shadow-sm"
                    style={{
                      background: brandInfo?.primary_color ?? "#10b981",
                      color: brandInfo
                        ? isColorDark(brandInfo.primary_color || "#000000")
                          ? "white"
                          : "black"
                        : "white",
                    }}
                    onClick={handleGetHtmlReport}
                  >
                    {loadingHtmlReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Download"
                    )}
                  </Button>
                  <Button
                    id="view-pdf-report-Box"
                    className="h-10 flex-1 rounded-xl text-sm font-medium text-white shadow-sm"
                    style={{
                      background: brandInfo?.secondary_color ?? "#8b5cf6",
                      color: brandInfo
                        ? isColorDark(brandInfo.secondary_color || "#000000")
                          ? "white"
                          : "black"
                        : "white",
                    }}
                    onClick={handleViewHtmlReport}
                  >
                    {loadingViewHtmlReport ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "View"
                    )}
                  </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
                            currentAnswers.filter((a) => a !== option),
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
    <div className="min-h-screen bg-gray-50/90 pb-[calc(var(--nav-height)+1rem)] dark:bg-gray-950">
      <div className="mx-auto max-w-md px-4 py-5">
        {currentView === "main" && (
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Hello, {clientInformation?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Here&apos;s your health overview
            </p>
          </div>
        )}
        {renderCurrentView()}
      </div>
    </div>
  );
}
