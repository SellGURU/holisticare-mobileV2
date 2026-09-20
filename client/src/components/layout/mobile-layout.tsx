// import { ReactNode, useEffect, useState } from "react";
import Application from "@/api/app";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";
import { Bell, Moon, Search, Sun } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "./bottom-navigation";
import ProfileHeader from "./profile-header";
import OfflineBanner from "@/components/OfflineBanner";
import { usePushNotifications } from "@/hooks/use-pushNotification";
import NotificationApi from "@/api/notification";
import { publish, subscribe, unsubscribe } from "@/lib/event";
import { Capacitor } from "@capacitor/core";
interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }:MobileLayoutProps ) {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { token, notifications } = usePushNotifications();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    if(platform === 'ios' || platform === 'android'){
      if(token){
        NotificationApi.registerToken(token).then((res) => {
          // console.log(res);
        });
      }
    }
  }, [token]);
  const getBrandInfo = async () => {
    Application.getBrandInfo()
      .then((res) => {
        publish("brand_info", { information: res.data.brand_elements });
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: getErrorMessage(res, "Could not load brand information."),
          variant: "destructive",
        });
      });
  };
  useEffect(() => {
    getBrandInfo();
  }, []);

  // Push notifications about a finished report open (or refresh) the report card
  useEffect(() => {
    const isReportPush = (event: any) =>
      String(event?.detail?.data?.type ?? "") === "report_ready";

    const handleActionPerformed = (event: any) => {
      if (!isReportPush(event)) return;
      if (location === "/") {
        publish("openHealthReport", {});
      } else {
        navigate("/?openReport=1");
      }
    };
    const handleReceived = (event: any) => {
      if (!isReportPush(event)) return;
      publish("healthReportUpdated", {});
    };

    subscribe("pushNotificationAction", handleActionPerformed);
    subscribe("pushNotificationReceived", handleReceived);

    return () => {
      unsubscribe("pushNotificationAction", handleActionPerformed);
      unsubscribe("pushNotificationReceived", handleReceived);
    };
  }, [location, navigate]);

  // Reset scroll position whenever the route changes so each page starts at top
  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  // Pages that should use the ProfileHeader instead of the default global header
  const useProfileHeader = true; // Use ProfileHeader for all pages for consistency

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    toast({
      title: isDarkMode ? "Light mode enabled" : "Dark mode enabled",
      description: "Theme preference saved",
    });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast({
        title: "Search Results",
        description: `Searching for "${searchQuery}" across your health data...`,
      });
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-gray-50 w-full relative dark:bg-gray-900">
      <OfflineBanner />
      {useProfileHeader ? (
        <ProfileHeader />
      ) : (
        /* Global Header */
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              HolistiCare
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(true)}
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "No new notifications",
                  });
                }}
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </header>
      )}

      <div
        id="main-scroll-container"
        ref={scrollContainerRef}
        className={`flex-1 overscroll-contain min-h-0 ${
          location === "/chat"
            ? "overflow-hidden"
            : "overflow-y-auto pb-20"
        }`}
      >
        {useProfileHeader ? (
          children
        ) : (
          <main className="p-4">
            {children}
          </main>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search Health Data</DialogTitle>
            <DialogDescription>
              Search across lab results, plans, and health insights
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search biomarkers, plans, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                Search
              </Button>
              <Button variant="outline" onClick={() => setShowSearch(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
