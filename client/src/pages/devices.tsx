import Application from "@/api/app";
import {
  BrandWashCard,
  PAGE_SHELL,
  PageHeader,
} from "@/components/layout/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useClientInformationQuery } from "@/hooks/queries";
import { RookHealthConnect, RookPermissions, RookSamsungHealth } from "capacitor-rook-sdk";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Shield,
  Smartphone,
  Watch,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  enablePlatformBackgroundSync,
  getPlatformHealthSourceName,
  initializeRookForUser,
  isIOSRookPlatform,
  isRookRoomMigrationError,
  isRookSummarySyncSupported,
  openNativeAppSettings,
  requestPlatformHealthPermissions,
  syncRookSummaries,
  withTimeout,
} from "@/lib/rook";
import { openExternalUrl } from "@/lib/open-external-url";
import { ToastAction } from "@/components/ui/toast";

const DEVICE_IMAGE_FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTJMMjggMjBIMjBMMjQgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAzNkwyMCAyOEgyOEwyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

function DeviceCard({
  name,
  image,
  description,
  status,
  onPrimaryAction,
  primaryLabel,
  onSync,
  isSyncing,
  showSync,
}: {
  name: string;
  image: string;
  description: string;
  status: ConnectionStatus | boolean;
  onPrimaryAction: () => void;
  primaryLabel?: string;
  onSync?: () => void;
  isSyncing?: boolean;
  showSync?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isConnected =
    typeof status === "boolean" ? status : status === "connected";
  const isConnecting =
    typeof status === "boolean" ? false : status === "connecting";
  const statusLabel = isConnecting
    ? "Connecting…"
    : isConnected
      ? "Connected"
      : "Not connected";
  const shortDescription =
    description.length > 120 && !expanded
      ? `${description.slice(0, 120).trim()}…`
      : description;

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/90 shadow-md dark:bg-gray-800/90">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 shadow-sm dark:bg-gray-700/80">
            <img
              src={image}
              alt={name}
              className="h-10 w-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEVICE_IMAGE_FALLBACK;
              }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {name}
              </h3>
              <Badge
                variant="outline"
                className={`flex-shrink-0 border-0 px-2 py-0.5 text-[10px] font-medium ${
                  isConnected
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : isConnecting
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                <span
                  className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                    isConnected
                      ? "bg-emerald-500"
                      : isConnecting
                        ? "animate-pulse bg-amber-500"
                        : "bg-gray-400"
                  }`}
                />
                {statusLabel}
              </Badge>
            </div>
            {description ? (
              <div className="mt-2">
                <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {shortDescription}
                </p>
                {description.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    {expanded ? (
                      <>
                        Show less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Show more <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            disabled={isConnecting}
            variant={isConnected ? "outline" : "default"}
            className={`h-11 flex-1 rounded-xl text-sm font-medium ${
              isConnected
                ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
            }`}
            onClick={onPrimaryAction}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              primaryLabel ?? (isConnected ? "Disconnect" : "Connect")
            )}
          </Button>
          {showSync && isConnected && onSync && (
            <Button
              variant="secondary"
              className="h-11 flex-1 rounded-xl text-sm font-medium"
              disabled={isSyncing}
              onClick={onSync}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync now
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Devices() {
  const { toast } = useToast();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const { data: clientInformation } = useClientInformationQuery();

  // Helper function to detect if device is Samsung
  const isSamsungDevice = () => {
    // return true;
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      // Check for Samsung in user agent (common patterns: SM-, Samsung, GT-)
      return /samsung|SM-|GT-/i.test(userAgent);
    }
    // For native platforms, also check if we can detect Samsung
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      // Additional check: Samsung devices often have specific characteristics
      // This is a fallback if user agent doesn't work in native context
      try {
        const userAgent = (window as any).navigator?.userAgent || '';
        return /samsung|SM-|GT-/i.test(userAgent);
      } catch {
        return false;
      }
    }
    return false;
  };

  // Helper function to detect platform
  const getPlatformInfo = () => {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      return {
        isIOS: platform === 'ios',
        isAndroid: platform === 'android',
        googleDescription: `
        Health Connect lets you track and analyze your health and fitness activities. It works seamlessly with compatible devices, such as smartwatches and activity trackers. Monitor your workouts, steps, heart rate, and other health metrics, and instantly see your progress. All your data syncs wirelessly to Health Connect so you can access it anytime, anywhere.
        `,
        appleDescription: `
         Connect with Apple Health
Enable integration with Apple Health to sync your health and activity data.
This app uses Apple Health (HealthKit) to read and write your health data securely.

        `,
        name: platform === 'ios' ? 'Apple Health' :'Health Connect',
        icon: platform === 'ios' 
          ? "AppleHealth.png"
          : "health-conncet.png"
      };
    } else {
      return {
        isIOS: false,
        isAndroid: true,
        googleDescription: `
        Health Connect lets you track and analyze your health and fitness activities. It works seamlessly with compatible devices, such as smartwatches and activity trackers. Monitor your workouts, steps, heart rate, and other health metrics, and instantly see your progress. All your data syncs wirelessly to Health Connect so you can access it anytime, anywhere.
        `,        
        name: 'Health Connect',
        icon: "health-conncet.png"
      };
    }
  };

  const [devicesData, setDevicesData] = useState<any>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [devicesLoadError, setDevicesLoadError] = useState(false);
  const [isConnecting, setIsConnecting] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isConnectingSamsungHealth, setIsConnectingSamsungHealth] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isSyncingPlatformData, setIsSyncingPlatformData] = useState(false);
  const [isSyncingSamsungData, setIsSyncingSamsungData] = useState(false);
  const [openedWindow, setOpenedWindow] = useState<Window | null>(null);
  const [awaitingExternalAuth, setAwaitingExternalAuth] = useState(false);
  const wasHiddenRef = useRef(false);

  // Restore connection state from localStorage on component mount
  useEffect(() => {
    const savedConnectionState = localStorage.getItem('health_device_connection_state');
    const savedSamsungHealthConnectionState = localStorage.getItem('samsung_health_device_connection_state');
    if (savedConnectionState) {
      if(savedConnectionState != 'connecting'){
        setIsConnecting(savedConnectionState as 'disconnected' | 'connecting' | 'connected');
      }
    }
    if (savedSamsungHealthConnectionState) {
      if(savedSamsungHealthConnectionState != 'connecting'){
        setIsConnectingSamsungHealth(savedSamsungHealthConnectionState as 'disconnected' | 'connecting' | 'connected');
      }
    }
    // Restore Samsung Health connection state
  }, []);

  // Save connection state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('samsung_health_device_connection_state', isConnectingSamsungHealth);
    localStorage.setItem('health_device_connection_state', isConnecting);
  }, [isConnecting, isConnectingSamsungHealth]);

  // Save Samsung Health connection state

  // Function to clear connection state (for testing or manual reset)
  const clearConnectionState = () => {
    setIsConnecting('disconnected');
    localStorage.removeItem('health_device_connection_state');
    // localStorage.removeItem('samsung_health_device_connection_state');
    toast({
      title: "Connection Reset",
      description: "Device connection state has been cleared.",
    });
  };

  const fetchDevicesData = useCallback(async () => {
    if (!clientInformation?.id) {
      toast({
        title: "Error",
        description: "User id not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingDevices(true);
    setDevicesLoadError(false);
    try {
      const res = await Application.rookAuthorizedDataSources({ user_id: clientInformation.id });
      const data = res.data;
      // Exclude Apple Health, Health Connect, Android from the list (handled separately above)
      const EXCLUDED_DATA_SOURCES = ["Apple Health", "Health Connect", "Android", "Whoop", "Dexcom"];
      const filteredSources = (data?.data_sources || []).filter(
        (el: { data_source: string }) => !EXCLUDED_DATA_SOURCES.includes(el.data_source)
      );
      // Descriptions for each data source
      const DATA_SOURCE_DESCRIPTIONS: Record<string, string> = {
        Polar:
          "Polar Flow allows you to analyze sports activity and fitness and is used with GPS-enabled heart rate monitors, fitness devices and activity trackers from Polar.* Track your training and activity and instantly see your achievements. You can view all your training and activity data on your phone on the go and wireless sync it to the Polar Flow service",
        Fitbit:
          "Fitbit is part of Google. Together we can make health and well -being more accessible to more people. We present one of the most important applications in the world about health and fitness. Use the Fitbit application alone to monitor basic statistics and maintain motivation.",
        Garmin:
          "Garmin Connect is the tool for tracking, analyzing and sharing health and fitness activities from your Garmin device.",
        Withings: "Delivering reliable medical, health and wellness data with a better experience.",
        Oura:
          "Health tracking wrapped around your finger — track your sleep, activity, recovery in style.",
      };
      // Map API response (data_source, authorized, image) to UI shape (name, connected, description, image)
      const mapped = {
        data_sources: filteredSources.map((el: { data_source: string; authorized: boolean; image: string }) => ({
          name: el.data_source,
          connected: el.authorized,
          description: DATA_SOURCE_DESCRIPTIONS[el.data_source] ?? "",
          image: el.image,
        })),
      };
      setDevicesData(mapped);
      setDevicesLoadError(false);
    } catch (error) {
      setDevicesLoadError(true);
      console.error("Error fetching devices data:", error);
      toast({
        title: "Error",
        description: `Failed to load devices data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDevices(false);
    }
  }, [clientInformation?.id, toast]);

  useEffect(() => {
    if (clientInformation?.id) {
      fetchDevicesData();
    }
  }, [clientInformation?.id, fetchDevicesData]);

  // Check if opened window is closed and refetch devices data (only for web)
  useEffect(() => {
    if (!openedWindow) return;

    // Skip window.closed check on native platforms
    if (Capacitor.isNativePlatform()) {
      return;
    }

    const checkWindowClosed = setInterval(() => {
      if (openedWindow.closed) {
        fetchDevicesData();
        setOpenedWindow(null);
        clearInterval(checkWindowClosed);
      }
    }, 1000);

    return () => clearInterval(checkWindowClosed);
  }, [openedWindow, fetchDevicesData]);

  // Refresh after returning from OAuth (native Browser / visibility)
  useEffect(() => {
    if (!openedWindow && !awaitingExternalAuth) return;

    let appStateListener: { remove: () => Promise<void> | void } | null = null;
    let browserFinishedListener: { remove: () => Promise<void> | void } | null =
      null;

    const refreshAfterAuth = () => {
      void fetchDevicesData();
      setAwaitingExternalAuth(false);
    };

    if (Capacitor.isNativePlatform()) {
      appStateListener = CapacitorApp.addListener("appStateChange", (state) => {
        if (state.isActive && (openedWindow || awaitingExternalAuth)) {
          refreshAfterAuth();
        }
      });

      void import("@capacitor/browser")
        .then(({ Browser }) =>
          Browser.addListener("browserFinished", () => {
            refreshAfterAuth();
          }),
        )
        .then((handle) => {
          browserFinishedListener = handle;
        })
        .catch(() => {
          // Browser plugin optional at runtime
        });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
      } else if (
        document.visibilityState === "visible" &&
        wasHiddenRef.current &&
        (openedWindow || awaitingExternalAuth)
      ) {
        refreshAfterAuth();
        wasHiddenRef.current = false;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (appStateListener) {
        void appStateListener.remove();
      }
      if (browserFinishedListener) {
        void browserFinishedListener.remove();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [openedWindow, awaitingExternalAuth, fetchDevicesData]);

  async function revokeRookDataSource(sourceOrId: string) {
    if (!clientInformation?.id) return;
    try {
      await Application.rookRevokeDataSource({
        user_id: clientInformation.id,
        data_source: sourceOrId,
      });
      await fetchDevicesData();
    } catch (e) {
      console.error("Revoke Rook data source error:", e);
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to revoke",
        variant: "destructive",
      });
    }
  }

  const connectSdk = () => {
    setShowPermissionModal(true);
  };

  const executeConnection = async () => {
    setIsConnecting("connecting");
    if (!clientInformation?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Please try again.",
        variant: "destructive",
      });
      setIsConnecting("disconnected");
      return;
    }

    try {
      await withTimeout(
        initializeRookForUser({ userId: clientInformation.id }),
        45_000,
        "Rook initialization",
      );
      await withTimeout(
        requestPlatformHealthPermissions(),
        120_000,
        "Health permissions",
      );
      const backgroundSyncResult = await withTimeout(
        enablePlatformBackgroundSync({ scheduleYesterday: false }),
        20_000,
        "Background sync setup",
      );

      setIsConnecting("connected");
      toast({
        title: "Connected Successfully",
        description: isIOSRookPlatform()
          ? `${getPlatformHealthSourceName()} connected successfully. Background sync is enabled and your data will upload automatically.`
          : `${getPlatformHealthSourceName()} connected successfully. Background sync is enabled and Sync Now is available as a fallback.`,
      });

      if (
        !isIOSRookPlatform() &&
        backgroundSyncResult &&
        !backgroundSyncResult.backgroundSyncEnabled
      ) {
        console.warn(
          "⚠️ Health Connect background sync not enabled:",
          backgroundSyncResult.backgroundReadStatus,
          backgroundSyncResult.error,
        );
        toast({
          title: "Background Sync Limited",
          description:
            'Automatic background sync could not be scheduled. Open Health Connect settings and allow "Access data in the background" for this app, then use Sync Now to update your data manually in the meantime.',
        });
      }

      if (isRookSummarySyncSupported()) {
        void syncRookSummaries()
          .then(() => console.log("✅ Summaries synced"))
          .catch((syncError) => console.warn("⚠️ Initial sync skipped:", syncError));
      } else if (isIOSRookPlatform()) {
        console.log("ℹ️ iOS summary sync is handled by ROOK background delivery in this SDK version");
      }
    } catch (e: any) {
      console.error("❌ Error initializing Rook:", e);
      setIsConnecting("disconnected");

      const errorMessage = e?.message || e?.toString() || "Unknown error occurred";

      if (isRookRoomMigrationError(e) || isRookRoomMigrationError(errorMessage)) {
        toast({
          title: "Connection Failed",
          description:
            "Local health cache is out of date for this app version. Open App Settings → Storage → Clear storage, then try Connect again. (Or uninstall and reinstall without restoring backup.)",
          variant: "destructive",
          action: (
            <ToastAction
              altText="Open app settings"
              onClick={() => {
                void openNativeAppSettings();
              }}
            >
              App Settings
            </ToastAction>
          ),
        });
        return;
      }

      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${getPlatformHealthSourceName()}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const executeSamsungHealthConnection = async () => {
    setIsConnectingSamsungHealth("connecting");

    try {
      if (!clientInformation?.id) {
        throw new Error("User ID not found");
      }

      const userId = clientInformation.id;

      /* ------------------------------------------------------------------ */
      /* 1️⃣ Init Rook SDK */
      /* ------------------------------------------------------------------ */
      await initializeRookForUser({
        enableBackgroundSync: false, // ⛔️ فعلاً خاموش
        enableEventsBackgroundSync: false,
        userId,
      });

      /* ------------------------------------------------------------------ */
      /* 3️⃣ Android Runtime Permissions (Capacitor) */
      /* ------------------------------------------------------------------ */
      await requestPlatformHealthPermissions();

      /* ------------------------------------------------------------------ */
      /* 4️⃣ Check Samsung Health availability (SAFE) */
      /* ------------------------------------------------------------------ */
      const availability =
        await RookSamsungHealth
          .checkSamsungHealthAvailability()
          .catch(() => null);

      if (!availability || availability.result !== "INSTALLED") {
        throw new Error("Samsung Health is not installed or not ready");
      }

      console.log("✅ Samsung Health available");

      /* ------------------------------------------------------------------ */
      /* 5️⃣ Request Samsung Health permissions (SAFE SET ONLY) */
      /* ------------------------------------------------------------------ */
      await RookPermissions.requestSamsungHealthPermissions({
        types: ["STEPS", "HEART_RATE", "SLEEP"],
      });

      console.log("✅ Samsung Health permissions granted");

      /* ------------------------------------------------------------------ */
      /* 6️⃣ Wait for provider binding (CRITICAL) */
      /* ------------------------------------------------------------------ */
      await new Promise(resolve => setTimeout(resolve, 2000));

      /* ------------------------------------------------------------------ */
      /* 7️⃣ Initial sync (NON-CRITICAL) */
      /* ------------------------------------------------------------------ */
      try {
        await syncRookSummaries();
        console.log("✅ Summaries synced");
      } catch (syncError) {
        console.warn("⚠️ Sync skipped:", syncError);
      }

      /* ------------------------------------------------------------------ */
      /* 8️⃣ Success */
      /* ------------------------------------------------------------------ */
      setIsConnectingSamsungHealth("connected");

      toast({
        title: "Connected Successfully",
        description: "Samsung Health connected successfully.",
      });

    } catch (error: any) {
      console.error("❌ Samsung Health connection failed:", error);

      setIsConnectingSamsungHealth("disconnected");

      if (isRookRoomMigrationError(error)) {
        toast({
          title: "Connection Failed",
          description:
            "Local health cache is out of date for this app version. Open App Settings → Storage → Clear storage, then try Connect again.",
          variant: "destructive",
          action: (
            <ToastAction
              altText="Open app settings"
              onClick={() => {
                void openNativeAppSettings();
              }}
            >
              App Settings
            </ToastAction>
          ),
        });
        return;
      }

      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect Samsung Health",
        variant: "destructive",
      });
    }
  };

  const handlePlatformDisconnect = async () => {
    try {
      if (Capacitor.getPlatform() === "android") {
        await RookHealthConnect.cancelHealthConnectBackGround();
      }
    } catch (error) {
      console.warn("Failed to stop platform background sync:", error);
    } finally {
      clearConnectionState();
    }
  };

  const handleManualSync = async (target: "platform" | "samsung") => {
    const isPlatformSync = target === "platform";
    const setSyncing = isPlatformSync ? setIsSyncingPlatformData : setIsSyncingSamsungData;

    if (!clientInformation?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);

    try {
      await initializeRookForUser({
        userId: clientInformation.id,
        enableBackgroundSync: target === "platform",
        enableEventsBackgroundSync: target === "platform",
      });

      if (!isRookSummarySyncSupported()) {
        toast({
          title: "Automatic Sync Enabled",
          description: "Apple Health uses background delivery in this version. Reopen the app later to confirm new data has synced.",
        });
        return;
      }

      await syncRookSummaries();

      toast({
        title: "Sync Completed",
        description: `${isPlatformSync ? getPlatformHealthSourceName() : "Samsung Health"} data sync was triggered successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error?.message || "Unable to sync health data right now.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Sync connection state with backend
    if(isConnecting === "connected"){
      const platformInfo = getPlatformInfo();
      if(platformInfo.isIOS){
        Application.connectVariable('Apple Health').catch((err) => {
          console.error("Failed to connect Apple Health variable:", err);
        });
      } else {
        Application.connectVariable('Health Connect').catch((err) => {
          console.error("Failed to connect Health Connect variable:", err);
        });
      }
    } else if(isConnecting === "disconnected") {
      const platformInfo = getPlatformInfo();
      if(platformInfo.isIOS){
        Application.disConnectVariable('Apple Health').catch((err) => {
          console.error("Failed to disconnect Apple Health variable:", err);
        });
      } else {
        Application.disConnectVariable('Health Connect').catch((err) => {
          console.error("Failed to disconnect Health Connect variable:", err);
        });
      }
    }
    if(isConnectingSamsungHealth === "connected"){
      Application.connectVariable('Samsung Health').catch((err) => {
        console.error("Failed to connect Samsung Health variable:", err);
      });
    } else if(isConnectingSamsungHealth === "disconnected"){
      Application.disConnectVariable('Samsung Health').catch((err) => {
        console.error("Failed to disconnect Samsung Health variable:", err);
      });
    }
    
    // Sync other devices
    if (devicesData?.data_sources) {
      devicesData.data_sources.forEach((el:any) => {
        if (el.connected) {
          Application.connectVariable(el.name).catch((err) => {
            console.error(`Failed to connect ${el.name} variable:`, err);
          });
        } else {
          Application.disConnectVariable(el.name).catch((err) => {
            console.error(`Failed to disconnect ${el.name} variable:`, err);
          });
        }
      });
    }
  }, [devicesData?.data_sources, isConnecting, isConnectingSamsungHealth]);

  const platformInfo = getPlatformInfo();
  const connectedCount = useMemo(() => {
    let count = 0;
    if (isConnecting === "connected") count++;
    if (isConnectingSamsungHealth === "connected") count++;
    devicesData?.data_sources?.forEach((s: { connected: boolean }) => {
      if (s.connected) count++;
    });
    return count;
  }, [devicesData, isConnecting, isConnectingSamsungHealth]);

  const totalSources = useMemo(() => {
    const thirdParty = devicesData?.data_sources?.length ?? 0;
    const nativeCount = Capacitor.isNativePlatform() ? 2 : 0;
    return thirdParty + nativeCount;
  }, [devicesData]);

  const handleThirdPartyConnect = (source: {
    name: string;
    connected: boolean;
  }) => {
    if (source.connected) {
      revokeRookDataSource(source.name).then(() => {
        toast({
          title: "Disconnected",
          description: `${source.name} has been disconnected.`,
        });
      });
      return;
    }

    Application.rookAuthorizedDataSource({
      data_source: source.name,
      user_id: clientInformation?.id! as string,
    })
      .then(async (res) => {
        const authorizationUrl = res?.data?.authorization_url;
        if (!authorizationUrl) {
          throw new Error("Authorization URL was not returned.");
        }

        if (Capacitor.isNativePlatform()) {
          // iOS/Android: open outside WebView (SFSafariViewController / Custom Tabs)
          await openExternalUrl(authorizationUrl);
          setAwaitingExternalAuth(true);
        } else {
          const newWindow = window.open(authorizationUrl, "_blank");
          if (newWindow) setOpenedWindow(newWindow);
          else await openExternalUrl(authorizationUrl);
        }

        toast({
          title: "Continue in browser",
          description: `Complete ${source.name} authorization, then return here.`,
        });
      })
      .catch((err) => {
        toast({
          title: "Connection failed",
          description: err.message ?? `Could not connect to ${source.name}.`,
          variant: "destructive",
        });
      });
  };

  const showDevicesLoading =
    isLoadingDevices || (!devicesData && !devicesLoadError);
  const showDevicesContent = Boolean(devicesData);
  const showDevicesError = !showDevicesLoading && devicesLoadError;

  return (
    <div className={PAGE_SHELL}>
      {/* Sticky mobile header */}
      <div className="sticky top-0 z-20 border-b border-gray-200/50 bg-white/90 backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="h-10 w-10 flex-shrink-0 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              Devices
            </h1>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Connect wearables & health apps
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh devices"
            disabled={isLoadingDevices}
            onClick={() => void fetchDevicesData()}
            className="h-10 w-10 flex-shrink-0 rounded-xl"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingDevices ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-4 py-4">
        <PageHeader
          className="mb-0"
          icon={Watch}
          eyebrow="Wearables"
          title="Stay in sync"
          subtitle="Sync steps, heart rate, sleep & more into your wellness profile."
          percent={
            totalSources
              ? Math.round((connectedCount / totalSources) * 100)
              : undefined
          }
        />

        {showDevicesContent && (
          <BrandWashCard
            percent={
              totalSources
                ? Math.round((connectedCount / totalSources) * 100)
                : 0
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/70 px-3 py-2.5 text-center dark:bg-gray-900/30">
                <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                  {connectedCount}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Connected
                </p>
              </div>
              <div className="rounded-xl bg-white/70 px-3 py-2.5 text-center dark:bg-gray-900/30">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {Math.max(totalSources - connectedCount, 0)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Available
                </p>
              </div>
            </div>
          </BrandWashCard>
        )}

        {/* Privacy note */}
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 px-3 py-2.5 dark:bg-blue-900/15">
          <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-xs leading-relaxed text-blue-800/80 dark:text-blue-200/80">
            Your health data is encrypted and only used to personalize your
            plan. You can disconnect anytime.
          </p>
        </div>

        {showDevicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-white/60 dark:bg-gray-800/40"
              />
            ))}
          </div>
        ) : showDevicesContent ? (
          <div className="space-y-6">
            {Capacitor.isNativePlatform() && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    On this device
                  </h2>
                </div>
                <div className="space-y-3">
                  <DeviceCard
                    name={platformInfo.name}
                    image={platformInfo.icon}
                    description={
                      platformInfo.isAndroid
                        ? platformInfo.googleDescription.trim()
                        : platformInfo.appleDescription.trim()
                    }
                    status={isConnecting}
                    onPrimaryAction={() => {
                      if (isConnecting === "connected") {
                        void handlePlatformDisconnect();
                      } else {
                        connectSdk();
                      }
                    }}
                    showSync
                    isSyncing={isSyncingPlatformData}
                    onSync={() => void handleManualSync("platform")}
                  />
                  <DeviceCard
                    name="Samsung Health"
                    image="./Samsung_Health_2025_logo.png"
                    description="Track workouts, steps, heart rate, and sleep. Syncs with Galaxy Watch and compatible fitness bands."
                    status={isConnectingSamsungHealth}
                    onPrimaryAction={() => {
                      if (isConnectingSamsungHealth === "connected") {
                        RookSamsungHealth.disableBackGroundUpdates();
                        setIsConnectingSamsungHealth("disconnected");
                        localStorage.removeItem(
                          "samsung_health_device_connection_state"
                        );
                      } else if (isSamsungDevice()) {
                        void executeSamsungHealthConnection();
                      } else {
                        toast({
                          title: "Samsung device required",
                          description:
                            "Samsung Health is only available on Samsung Android devices.",
                          variant: "destructive",
                        });
                      }
                    }}
                    showSync
                    isSyncing={isSyncingSamsungData}
                    onSync={() => void handleManualSync("samsung")}
                  />
                </div>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Watch className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Apps & wearables
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  {devicesData.data_sources?.length ?? 0} sources
                </span>
              </div>

              {devicesData.data_sources?.length ? (
                <div className="space-y-3">
                  {devicesData.data_sources.map((source: any) => (
                    <DeviceCard
                      key={source.name}
                      name={source.name}
                      image={source.image}
                      description={source.description}
                      status={source.connected}
                      onPrimaryAction={() => handleThirdPartyConnect(source)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/60 px-4 py-8 text-center dark:bg-gray-800/40">
                  <Watch className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No third-party sources available right now.
                  </p>
                </div>
              )}
            </section>
          </div>
        ) : showDevicesError ? (
          <div className="flex flex-col items-center rounded-2xl bg-white/60 px-6 py-12 text-center dark:bg-gray-800/40">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
              <Watch className="h-8 w-8 text-emerald-600/70 dark:text-emerald-400/70" />
            </span>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Couldn&apos;t load devices
            </h3>
            <p className="mt-1 max-w-[16rem] text-sm text-gray-500 dark:text-gray-400">
              Check your connection and try again.
            </p>
            <Button
              className="mt-4 h-11 rounded-xl"
              onClick={() => void fetchDevicesData()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : null}
      </div>

      {/* Health permission sheet */}
      <Sheet open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <SheetContent
          side="bottom"
          className="mx-auto flex w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
        >
          <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
            <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
          </div>

          <SheetHeader className="flex-shrink-0 space-y-0 px-5 pb-3 pt-1 text-left">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Allow health access
                  </SheetTitle>
                  <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                    {platformInfo.name}
                  </SheetDescription>
                </div>
              </div>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="space-y-4 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {platformInfo.isIOS
                ? "This app reads your Apple Health data to power personalized wellness insights. Data is shared securely via ROOK."
                : "This app reads your Health Connect data to power personalized wellness insights. Data is shared securely via ROOK."}
            </p>

            <div className="flex flex-col gap-2">
              <Button
                className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                onClick={() => {
                  void executeConnection();
                  setShowPermissionModal(false);
                }}
              >
                Allow access
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => setShowPermissionModal(false)}
              >
                Not now
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
