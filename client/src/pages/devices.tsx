import Application from "@/api/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RookAppleHealth, RookConfig, RookEvents, RookHealthConnect, RookPermissions, RookSamsungHealth, RookSummaries, SamsungPermissionType } from "capacitor-rook-sdk";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Watch, ArrowLeft } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import Api from "@/api/api";

export default function Devices() {
  const { fetchClientInformation } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
  const [clientInformation, setClientInformation] = useState<{
    id: string;
    name: string;
  }>();

  const handleGetClientInformation = async () => {
    Application.getClientInformation()
      .then((res) => {
        setClientInformation(res.data);
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res?.response?.data?.detail,
          variant: "destructive",
        });
      });
  };

  useEffect(() => {
    handleGetClientInformation();
  }, []);

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
  const [isConnecting, setIsConnecting] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isConnectingSamsungHealth, setIsConnectingSamsungHealth] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [openedWindow, setOpenedWindow] = useState<Window | null>(null);
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
    try {
      const response = await fetch(
        `https://api.rook-connect.com/api/v1/client_uuid/c2f4961b-9d3c-4ff0-915e-f70655892b89/user_id/${clientInformation.id}/data_sources/authorizers`,
        {
          method: "GET",
          headers: {
            Authorization:
              "Basic Y2xpZW50X3V1aWQ6UUg4dTE4T2pMb2ZzU1J2bUVEbUdCZ2p2MWZycDNmYXBkYkRB",
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDevicesData(data);

      toast({
        title: "Success",
        description: "Devices data loaded successfully",
      });


    } catch (error) {
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

  // Listen for app state changes and page visibility changes to refresh devices data
  // This works even if the window is still open - refreshes when user returns to app
  useEffect(() => {
    if (!openedWindow) return;

    // Handle app state changes for native platforms
    let appStateListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appStateListener = CapacitorApp.addListener('appStateChange', (state) => {
        // When app comes to foreground and we have an opened window, refresh devices data
        // This works even if the window is still open
        if (state.isActive && openedWindow) {
          fetchDevicesData();
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
        fetchDevicesData();
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
  }, [openedWindow, fetchDevicesData]);

  async function revokeRookDataSource(sourceOrId: string) {
    const encodedCreds = btoa(`c2f4961b-9d3c-4ff0-915e-f70655892b89:QH8u18OjLofsSRvmEDmGBgjv1frp3fapdbDA`);
    const body = { data_source: sourceOrId };
    if(!clientInformation){
      return;
    }
    const response = await fetch(
      `https://api.rook-connect.com/api/v1/user_id/${clientInformation?.id || '1'}/data_sources/revoke_auth`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Authorization": "Basic YzJmNDk2MWItOWQzYy00ZmYwLTkxNWUtZjcwNjU1ODkyYjg5OlFIOHUxOE9qTG9mc1NSdm1FRG1HQmdqdjFmcnAzZmFwZGJEQQ==",
            "Content-Type": "application/json",
        },
      }
    );   
    if(response){
      fetchDevicesData()
    } 
    // TODO: Implement revoke API call
  }

  const connectSdk = () => {
    setShowPermissionModal(true);
  };

  const executeConnection = () => {
    setIsConnecting("connecting");

    const initRook = async (userId: string) => {
      try {
        // 1. Initialize Rook SDK
        await RookConfig.initRook({
          environment: "production",
          clientUUID: "c2f4961b-9d3c-4ff0-915e-f70655892b89",
          password: "QH8u18OjLofsSRvmEDmGBgjv1frp3fapdbDA",
          enableBackgroundSync: true,
          enableEventsBackgroundSync: true,
        });
        console.log("✅ Initialized Rook SDK");

        // 2. Update User ID
        if (RookConfig.updateUserId) {
          await RookConfig.updateUserId({
            userId: userId,
          });
          console.log("✅ User ID updated:", userId);
        }

        // 3. Request Android permissions first (required for Health Connect)
        if(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'){
          const androidPerms = await RookPermissions.requestAndroidPermissions();
          console.log("✅ Android permissions:", androidPerms);
          const perms = await RookPermissions.requestAllHealthConnectPermissions();
          console.log("✅ HealthConnect permissions:", perms);

        } else if(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'){
          const iosPerms = await RookPermissions.requestAllAppleHealthPermissions();
          console.log("✅ Apple Health permissions:", iosPerms);
        }
        // 4. Request Health Connect permissions
        // // 5. Schedule sync
        try{
          if(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'){
            await RookPermissions.requestAndroidBackgroundPermissions();
            await RookHealthConnect.scheduleHealthConnectBackGround();
            await RookHealthConnect.scheduleYesterdaySync({
              doOnEnd: 'oldest' // یا 'latest' یا 'nothing' بر اساس نیازت
            });
          } else if(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'){
            await RookAppleHealth.enableBackGroundUpdates();
            await RookAppleHealth.enableBackGroundEventsUpdates();
          }
          
          // Sync summaries with error handling and delay to ensure SDK is ready
          try {
            // Add a small delay to ensure everything is initialized
            await new Promise(resolve => setTimeout(resolve, 500));
            await RookSummaries.sync({});
            console.log("✅ Summaries synced");
          } catch (syncError: any) {
            console.error("❌ Error syncing summaries (non-critical):", syncError);
            // Don't fail the entire connection if sync fails
            // This is a non-critical operation
          }

        }catch(e: any){
          toast({
            title: "Error",
            description: `Failed to schedule yesterday sync: ${e?.message || e?.toString() || "Unknown error"}`,
            variant: "destructive",
          });
          console.error("❌ Error scheduling yesterday sync:", e);
        }

        // 6. Set connected state only after all operations succeed
        setIsConnecting("connected");
        
        toast({
          title: "Connected Successfully",
          description: "Health Connect has been connected successfully.",
        });
      } catch (e: any) {
        console.error("❌ Error initializing Rook:", e);
        setIsConnecting("disconnected");
        
        // Show user-friendly error message
        const errorMessage = e?.message || e?.toString() || "Unknown error occurred";
        toast({
          title: "Connection Failed",
          description: `Failed to connect to Health Connect: ${errorMessage}`,
          variant: "destructive",
        });
      }
    };

    if (clientInformation?.id) {
      initRook(clientInformation.id);
    } else {
      toast({
        title: "Error",
        description: "User ID not found. Please try again.",
        variant: "destructive",
      });
      setIsConnecting("disconnected");
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
      await RookConfig.initRook({
        environment: "production",
        clientUUID: "c2f4961b-9d3c-4ff0-915e-f70655892b89",
        password: "QH8u18OjLofsSRvmEDmGBgjv1frp3fapdbDA",
        enableBackgroundSync: false, // ⛔️ فعلاً خاموش
        enableEventsBackgroundSync: false,
      });

      console.log("✅ Rook initialized");

      /* ------------------------------------------------------------------ */
      /* 2️⃣ Update User ID */
      /* ------------------------------------------------------------------ */
      await RookConfig.updateUserId({ userId });
      console.log("✅ User ID updated:", userId);

      /* ------------------------------------------------------------------ */
      /* 3️⃣ Android Runtime Permissions (Capacitor) */
      /* ------------------------------------------------------------------ */
      const androidPerms = await RookPermissions.requestAndroidPermissions();
      console.log("✅ Android permissions:", androidPerms);

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
        await RookSummaries.sync({});
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

      toast({
        title: "Connection Failed",
        description: error?.message || "Failed to connect Samsung Health",
        variant: "destructive",
      });
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
      if(!platformInfo.isIOS){
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-gray-900 dark:via-emerald-900/20 dark:to-teal-900/10">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/30 ">
        <div className="max-w-4xl mx-auto px-3 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-medium bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                Wearable Devices
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connect and manage your health devices
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4 space-y-4">
        {isLoadingDevices ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Watch className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Loading devices data...
            </p>
          </div>
        ) : devicesData ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {
                Capacitor.isNativePlatform() &&
                <>
                  <div
                    key={'-1'}
                    className="bg-gradient-to-r from-white/80 to-gray-50/60 dark:from-gray-700/80 dark:to-gray-800/60 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={getPlatformInfo().icon}
                          alt={getPlatformInfo().name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200/50 dark:border-gray-600/50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTJMMjggMjBIMjBMMjQgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAzNkwyMCAyOEgyOEwyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {getPlatformInfo().name}
                          </h4>
                          <Badge
                            variant={
                              isConnecting === 'connected' ? "default" : "outline"
                            }
                            className={`text-xs ${
                              isConnecting === 'connected'
                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                            }`}
                          >
                            {isConnecting === 'connected'
                              ? "Connected"
                              :
                                isConnecting === 'connecting' ? "Connecting" : "Not Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2 text-justify">
                          {getPlatformInfo().isAndroid ? getPlatformInfo().googleDescription : getPlatformInfo().appleDescription}
                        </p>
                        <Button
                          size="sm"
                          variant={
                            isConnecting === 'connected' ? "outline" : "default"
                          }
                          className={`text-xs h-7 ${
                            isConnecting === 'connected'
                              ? "border-red-200 text-red-600 md:hover:bg-red-50  dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              : "bg-blue-600 md:hover:bg-blue-700 text-white"
                          }`}
                          onClick={() => {
                            if (isConnecting === 'connected') {
                              RookHealthConnect.cancelHealthConnectBackGround()
                              clearConnectionState();
                            } else {
                              connectSdk();
                            }
                          }}
                        >
                          {isConnecting === 'connected' ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Samsung Health - Only show if Samsung device */}
                  
                  <div
                    key={'-2'}
                    className="bg-gradient-to-r from-white/80 to-gray-50/60 dark:from-gray-700/80 dark:to-gray-800/60 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={'./Samsung_Health_2025_logo.png'}
                          alt={'Samsung Health'}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200/50 dark:border-gray-600/50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTJMMjggMjBIMjBMMjQgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAzNkwyMCAyOEgyOEwyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            Samsung Health
                          </h4>
                          <Badge
                            variant={
                              isConnectingSamsungHealth === 'connected' ? "default" : "outline"
                            }
                            className={`text-xs ${
                              isConnectingSamsungHealth === 'connected'
                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                            }`}
                          >
                            {isConnectingSamsungHealth === 'connected'
                              ? "Connected"
                              :
                                isConnectingSamsungHealth === 'connecting' ? "Connecting" : "Not Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2 text-justify">
                          Samsung Health helps you stay on top of your wellness by tracking your daily activities and fitness data with ease. It connects smoothly with compatible devices like smartwatches and fitness bands, giving you real-time insights into your workouts, steps, heart rate, and more. You can view detailed trends, monitor your progress over time, and stay motivated with personalized stats. All your information syncs wirelessly across devices, so your health data is always accessible whenever and wherever you need it.
                        </p>
                        <Button
                          size="sm"
                          variant={
                            isConnectingSamsungHealth === 'connected' ? "outline" : "default"
                          }
                          className={`text-xs h-7 ${
                            isConnectingSamsungHealth === 'connected'
                              ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                          onClick={() => {
                            if (isConnectingSamsungHealth === 'connected') {
                              // clearConnectionState();
                              RookSamsungHealth.disableBackGroundUpdates();
                              setIsConnectingSamsungHealth('disconnected');
                              localStorage.removeItem('samsung_health_device_connection_state');
                            } else {
                              // connectSdk();
                              if(isSamsungDevice()){
                                executeSamsungHealthConnection();
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Samsung Health is not installed on this device.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                        >
                          {isConnectingSamsungHealth === 'connected' ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              }
              {/* Platform Health (Apple Health / Health Connect) - Only show if NOT Samsung */}       
              

              {/* Other Devices */}
              {devicesData.data_sources?.map(
                (source: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-white/80 to-gray-50/60 dark:from-gray-700/80 dark:to-gray-800/60 rounded-lg p-3 border border-gray-200/50 dark:border-gray-600/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={source.image}
                          alt={source.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200/50 dark:border-gray-600/50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMjQgMTJMMjggMjBIMjBMMjQgMTJaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAzNkwyMCAyOEgyOEwyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {source.name}
                          </h4>
                          <Badge
                            variant={
                              source.connected ? "default" : "outline"
                            }
                            className={`text-xs ${
                              source.connected
                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                                : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600"
                            }`}
                          >
                            {source.connected
                              ? "Connected"
                              : "Not Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2 text-justify">
                          {source.description}
                        </p>
                        <Button
                          size="sm"
                          variant={
                            source.connected ? "outline" : "default"
                          }
                          className={`text-xs h-7 ${
                            source.connected
                              ? "border-red-200 text-red-600 md:hover:bg-red-50  dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              : "bg-blue-600 md:hover:bg-blue-700 text-white"
                          }`}
                          onClick={() => {
                            if (source.connected) {
                              revokeRookDataSource(source.name).then(() => {
                                toast({
                                  title: "Disconnect",
                                  description: `Disconnect from ${source.name}`,
                                });
                                // fetchDevicesData();
                              });
                            } else {
                              const newWindow = window.open(
                                source.authorization_url,
                                "_blank"
                              );
                              if (newWindow) {
                                setOpenedWindow(newWindow);
                              }
                              toast({
                                title: "Connecting",
                                description: `Opening ${source.name} authorization...`,
                              });
                            }
                          }}
                        >
                          {source.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Watch className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No devices data available
            </p>
          </div>
        )}
      </div>

      {/* Permission Modal */}
      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-blue-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-blue-900/20 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
              <Watch className="w-4 h-4 text-blue-600" />
              Allow Health Access
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {getPlatformInfo().isIOS 
                ? "This app uses Apple Health (HealthKit) to read your health and fitness data. Your data will be shared with ROOK to provide personalized wellness insights. Do you want to allow access?"
                : "This app uses Health Connect to read your health and fitness data. Your data will be shared with ROOK to provide personalized wellness insights. Do you want to allow access?"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Watch className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  executeConnection();
                  setShowPermissionModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              >
                Allow Access
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

