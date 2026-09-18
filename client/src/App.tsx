import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import Application from "@/api/app";
import { enablePlatformBackgroundSync, initializeRookForUser, isIOSRookPlatform } from "@/lib/rook";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import LabUpload from "@/pages/lab-upload";
import ManualEntry from "@/pages/manual-entry";
import Trends from "@/pages/trends";
import ActionPlans from "@/pages/action-plans";
import HolisticPlans from "@/pages/holistic-plans";
import Profile from "@/pages/profile";
import Onboarding from "@/pages/onboarding";
import YouMenu from "@/pages/you-menu";
import ChatPage from "@/pages/chat";
import EducationalPage from "@/pages/educational";
import PlanPage from "@/pages/plan-simple";
import ActionPlanPage from "@/pages/action-plan";
import WearableDashboard from "@/pages/wearable-dashboard";
import Devices from "@/pages/devices";
import MobileLayout from "@/components/layout/mobile-layout";
import NotFound from "@/pages/not-found";
import BootGate from "@/components/BootGate";
import { LegalPrivacy, LegalTerms } from "@/pages/legal";
// import { usePushNotifications } from "./hooks/use-pushNotification";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar } from "@capacitor/status-bar";
import { useToast } from "./hooks/use-toast";
import { useVersionCheck } from "./hooks/use-version-check";
import {
  UpdateAvailableModal,
  UnsupportedVersionModal,
} from "@/components/version";
import AppProvider from "./components/layout/AppProvider";
import { getErrorMessage } from "./lib/error-message";

function Router() {
  const { isAuthenticated, fetchClientInformation, needsPasswordChange } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const isOnboardingCompleted =
    localStorage.getItem("onboardingCompleted") === "true";
  // const { token, notifications } = usePushNotifications();
  // useEffect(() => {
  //   alert(notifications[notifications.length -1].title)
  // },[notifications])
  // useServiceWorker();
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // اینجا مطمئن میشیم اپ روی موبایل ران شده
      StatusBar.setOverlaysWebView({ overlay: false });
      StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
  }, []);

  // Check password change requirement after login
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔍 Checking password change requirement...');
      fetchClientInformation()
        .then(() => {
          const needsChange = needsPasswordChange();
          console.log('🔍 Needs password change:', needsChange);

          if (needsChange) {
            console.log('🔍 Redirecting to profile page...');
            localStorage.setItem("requirePasswordChange", "true");
            setLocation("/profile");
            toast({
              title: "Password Change Required",
              description: "Please change your password for account security.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.warn("Password-change check skipped:", getErrorMessage(error));
        });
    }
  }, [isAuthenticated, fetchClientInformation, needsPasswordChange, setLocation, toast]);

  useEffect(() => {
    if (!isAuthenticated || !Capacitor.isNativePlatform()) {
      return;
    }

    let isCancelled = false;

    const bootstrapRook = async () => {
      try {
        const response = await Application.getClientInformation();
        const userId = response?.data?.id;

        if (isCancelled || !userId) {
          return;
        }

        await initializeRookForUser({ userId });

        if (isIOSRookPlatform()) {
          try {
            await enablePlatformBackgroundSync();
          } catch (error) {
            console.warn("ROOK iOS background sync is not ready yet:", error);
          }
        }
      } catch (error) {
        console.error("Failed to bootstrap ROOK:", getErrorMessage(error));
      }
    };

    void bootstrapRook();

    const appStateListener = CapacitorApp.addListener("appStateChange", (state) => {
      if (state.isActive) {
        void bootstrapRook();
      }
    });

    return () => {
      isCancelled = true;
      appStateListener.remove();
    };
  }, [isAuthenticated]);

  const {
    showUpdateModal,
    showUnsupportedModal,
    downloadLink,
    playStoreLink,
    setShowUpdateModal,
  } = useVersionCheck();
  // Prevent navigation to other pages if password change is required
  useEffect(() => {
    if (isAuthenticated && needsPasswordChange() && location !== "/profile") {
      setLocation("/profile");
      localStorage.setItem("requirePasswordChange", "true");
    }
  }, [location, isAuthenticated, needsPasswordChange, setLocation]);

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/privacy" component={LegalPrivacy} />
        <Route path="/terms" component={LegalTerms} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  return (
    <>
      <UpdateAvailableModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        downloadLink={downloadLink}
        playStoreLink={playStoreLink}
      />

      <UnsupportedVersionModal
        open={showUnsupportedModal}
        downloadLink={downloadLink}
        playStoreLink={playStoreLink}
      />

      {!showUnsupportedModal && (
        <>
          {!isAuthenticated ? (
            <Switch>
              <Route path="/onboarding" component={Onboarding} />
              <Route path="/privacy" component={LegalPrivacy} />
              <Route path="/terms" component={LegalTerms} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/" component={AuthPage} />
              <Route component={AuthPage} />
            </Switch>
          ) : (
            <AppProvider>
              <MobileLayout>
                <Switch>
                  <Route path="/onboarding" component={Onboarding} />
                  <Route path="/" component={YouMenu} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/monitor" component={Trends} />
                  <Route path="/chat" component={ChatPage} />
                  <Route path="/educational" component={EducationalPage} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/privacy" component={LegalPrivacy} />
                  <Route path="/terms" component={LegalTerms} />
                  <Route path="/devices" component={Devices} />
                  <Route path="/plan" component={PlanPage} />
                  <Route path="/action-plan" component={ActionPlanPage} />
                  <Route path="/lab-upload" component={LabUpload} />
                  <Route path="/manual-entry" component={ManualEntry} />
                  <Route path="/holistic-plans" component={HolisticPlans} />
                  <Route path="/not-found" component={NotFound} />
                  <Route path="/auth" component={YouMenu} />
                  <Route path="/wearable" component={WearableDashboard} />
                  <Route component={NotFound} />
                </Switch>
              </MobileLayout>
            </AppProvider>
          )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="mobile-container">
          <Toaster />
          <BootGate>
            <Router />
          </BootGate>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
