import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Crown,
  Heart,
  Check,
  X,
  Activity,
  Target,
  Brain,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import Auth from "@/api/auth";
import Application from "@/api/app";
import { toast } from "@/hooks/use-toast";
import NotificationApi from "@/api/notification";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import { subscribe } from "@/lib/event";
// import logoImage from "@assets/Logo5 2_1753791920091_1757240780580.png";

export default function ProfileHeader() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const [location, navigate] = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isUnReadNotif, setIsUnReadNotif] = useState(false);
  const [hadNotifications, setHadNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [clientInformation, setClientInformation] = useState<{
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
    has_changed_password?: boolean;
  }>();

  const handleGetClientInformation = async () => {
    Application.getClientInformation()
      .then((res) => {
        setClientInformation(res.data);
        // Check if password change is required
        if (res.data?.has_changed_password === false) {
          // Store flag to open password dialog
          localStorage.setItem("requirePasswordChange", "true");
          // Redirect to profile page only if not already there
          if (location !== "/profile") {
            navigate("/profile");
          }
          // Show toast notification
          toast({
            title: "Password Change Required",
            description: "Please change your password for account security.",
            variant: "destructive",
          });
        }
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        // setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const checkNewNotifications = async () => {
      try {
        const response = await NotificationApi.checkNotification();
        if (response && response.data && response.data.new_notifications) {
          setIsUnReadNotif(true);
          fetchNotifications();
        }
      } catch (error) {
        console.error("Error checking for new notifications:", error);
      }
    };

    checkNewNotifications();

    const intervalId = setInterval(checkNewNotifications, 12000);

    return () => clearInterval(intervalId);
  }, []);
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read_status).length;
    setNotificationCount(unreadCount);
    if (notifications.length > 0) {
      setHadNotifications(true);
    }
  }, [notifications]);
  const fetchNotifications = async () => {
    try {
      const res = await NotificationApi.getNotification();
      const notifData = res.data.map((n: any) => ({
        ...n,
        read_status: n.read_status || false,
        icon:
          n.type === "lab_result"
            ? Activity
            : n.type === "goal"
            ? Target
            : n.type === "insight"
            ? Brain
            : n.type === "reminder"
            ? Calendar
            : n.type === "trend"
            ? TrendingUp
            : Activity,
        color: n.color || "blue",
      }));
      setNotifications(notifData);
      if (notifData.length > 0) {
        setHadNotifications(true);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);
  useEffect(() => {
    if (notifications.filter((n) => n.read_status === false).length == 0) {
      setIsUnReadNotif(false);
    }
  }, [notifications]);
  const markAsRead = async (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
    );
    try {
      await NotificationApi.mark_read({ notification_id: id });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    setIsUnReadNotif(false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    try {
      await Promise.all(
        notifications.map((n) =>
          NotificationApi.mark_read({ notification_id: n.id })
        )
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleLogout = async () => {
    Auth.logOut();
    const brandInfo = localStorage.getItem("brand_info");
    const biometricEnabled = localStorage.getItem("biometric_enabled");
    localStorage.clear();
    // Restore brand_info if it existed
    if (brandInfo) {
      localStorage.setItem("brand_info", brandInfo);
    }
    if (biometricEnabled) {
      localStorage.setItem("biometric_enabled", biometricEnabled);
    }
    navigate("/");
    window.location.reload();
  };

  const getColorClasses = (color: string, read: boolean) => {
    const baseOpacity = read ? "30" : "60";
    const hoverOpacity = read ? "40" : "80";

    switch (color) {
      case "emerald":
        return `bg-gradient-to-r from-emerald-50/${baseOpacity} to-teal-50/${baseOpacity} dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100/${hoverOpacity} hover:to-teal-100/${hoverOpacity} dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30`;
      case "blue":
        return `bg-gradient-to-r from-blue-50/${baseOpacity} to-cyan-50/${baseOpacity} dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100/${hoverOpacity} hover:to-cyan-100/${hoverOpacity} dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30`;
      case "purple":
        return `bg-gradient-to-r from-purple-50/${baseOpacity} to-indigo-50/${baseOpacity} dark:from-purple-900/20 dark:to-indigo-900/20 hover:from-purple-100/${hoverOpacity} hover:to-indigo-100/${hoverOpacity} dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30`;
      case "orange":
        return `bg-gradient-to-r from-orange-50/${baseOpacity} to-amber-50/${baseOpacity} dark:from-orange-900/20 dark:to-amber-900/20 hover:from-orange-100/${hoverOpacity} hover:to-amber-100/${hoverOpacity} dark:hover:from-orange-900/30 dark:hover:to-amber-900/30`;
      case "green":
        return `bg-gradient-to-r from-green-50/${baseOpacity} to-emerald-50/${baseOpacity} dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100/${hoverOpacity} hover:to-emerald-100/${hoverOpacity} dark:hover:from-green-900/30 dark:hover:to-emerald-900/30`;
      default:
        return `bg-gradient-to-r from-gray-50/${baseOpacity} to-white/${baseOpacity} dark:from-gray-700/20 dark:to-gray-800/20 hover:from-gray-100/${hoverOpacity} hover:to-white/${hoverOpacity} dark:hover:from-gray-700/30 dark:hover:to-gray-800/30`;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "emerald":
        return "text-emerald-600 dark:text-emerald-400";
      case "blue":
        return "text-blue-600 dark:text-blue-400";
      case "purple":
        return "text-purple-600 dark:text-purple-400";
      case "orange":
        return "text-orange-600 dark:text-orange-400";
      case "green":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };
  const [brandInfo, setBrandInfo] = useState<{
    last_update: string;
    logo: string;
    name: string;
    headline: string;
    primary_color: string;
    secondary_color: string;
    tone: string;
    focus_area: string;
  }>();
  subscribe("brand_info", (data: any) => {
    setBrandInfo(data.detail.information);
    localStorage.setItem("brand_info", JSON.stringify(data.detail.information));
  });

  return (
    <div className="flex relative items-center justify-between p-3 sm:p-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:pt-[calc(env(safe-area-inset-top)+1rem)] bg-gradient-to-r from-gray-50/90 via-white/90 to-gray-50/90 dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30 shadow-lg">
      <div className="flex items-center gap-2 ">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
          <img
            src={brandInfo ? brandInfo?.logo : "./logo.png"}
            alt="HolistiCare Logo"
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <h1 className="text-lg sm:text-xl font-thin bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {brandInfo ? brandInfo?.name || "HolistiCare" : "HolistiCare"}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNotifications(!showNotifications);
            }}
            className="relative w-10 h-10 rounded-full bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-gray-200/50 dark:hover:bg-gray-700/50 hover:shadow-lg transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            {(notificationCount > 0 || isUnReadNotif) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-lg animate-pulse">
                {notificationCount || 1}
              </div>
            )}
          </Button>
        </div>

        {/* Notification Portal */}
        {showNotifications &&
          createPortal(
            <>
              {/* Background Overlay */}
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[999998]"
                onClick={() => setShowNotifications(false)}
              />
              {/* Notification Panel */}
              <div className="absolute right-[5%] sm:right-[15%] md:right-[28%] xl:right-[35%] 2xl:right-[39%] top-16 w-[95%] max-w-[420px] sm:w-[480px] md:w-[520px] lg:w-[560px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-2xl rounded-2xl max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-hidden z-[999999]">
                {/* Header */}
                <div className="p-2.5 sm:p-3 md:p-4 border-b border-gray-200/30 dark:border-gray-700/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-gray-100">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2">
                      {isUnReadNotif && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 px-2 py-1"
                        >
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">
                            Mark all read
                          </span>
                          <span className="sm:hidden">Read</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowNotifications(false)}
                        className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  {(notificationCount > 0 || isUnReadNotif) && (
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      You have {notificationCount} unread notification
                      {notificationCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[300px] sm:max-h-[400px] md:max-h-[480px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 sm:p-8 text-center">
                      <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        No notifications
                      </p>
                      {hadNotifications && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
                          You're all caught up!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4">
                      {notifications.map((notification) => {
                        const IconComponent = notification.icon;
                        return (
                          <div
                            key={notification.id}
                            className={`p-2.5 sm:p-3 md:p-4 rounded-xl transition-all duration-300 cursor-pointer group ${getColorClasses(
                              notification.color,
                              notification.read_status
                            )} ${
                              !notification.read_status
                                ? "border-l-4 border-blue-500"
                                : ""
                            }`}
                            onClick={() =>
                              !notification.read_status &&
                              markAsRead(notification.id)
                            }
                          >
                            <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3">
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  notification.read_status
                                    ? "bg-gray-200/50 dark:bg-gray-700/50"
                                    : `bg-gradient-to-br from-${notification.color}-500/20 to-${notification.color}-600/20 dark:from-${notification.color}-400/20 dark:to-${notification.color}-500/20`
                                }`}
                              >
                                <IconComponent
                                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${
                                    notification.read_status
                                      ? "text-gray-500"
                                      : getIconColor(notification.color)
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                {/* Title Row with Buttons */}
                                <div className="flex items-start justify-between gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                                  <h4
                                    className={`text-[11px] sm:text-xs md:text-sm font-medium break-words flex-1 min-w-0 pr-1 ${
                                      notification.read_status
                                        ? "text-gray-600 dark:text-gray-400"
                                        : "text-gray-900 dark:text-gray-100"
                                    }`}
                                  >
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                    {!notification.read_status && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/30"
                                      >
                                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeNotification(notification.id);
                                      }}
                                      className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 hover:bg-red-100/60 dark:hover:bg-red-900/30"
                                    >
                                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    </Button>
                                  </div>
                                </div>
                                {/* Message Row - Full Width */}
                                <div
                                  className={`text-[10px] sm:text-xs leading-relaxed break-words ${
                                    notification.read_status
                                      ? "text-gray-500 dark:text-gray-500"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {notification.message}
                                </div>
                                {/* <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                                  <div
                                    className={`w-1 h-1 rounded-full ${
                                    notification.read_status
                                        ? "bg-gray-400"
                                        : "bg-blue-500 animate-pulse"
                                    }`}
                                  />
                                  {notification.time}
                                </div> */}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {/* {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200/30 dark:border-gray-700/30">
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        setShowNotifications(false);
                        // Navigate to notifications page if it exists
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )} */}
              </div>
            </>,
            document.body
          )}

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 hover:shadow-lg transition-all duration-300"
            >
              <Avatar className="h-10 w-10 shadow-lg">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback
                  className="text-white font-medium text-[10px]"
                  style={{
                    background: `linear-gradient(to right, ${
                      brandInfo ? brandInfo?.primary_color : `#3b82f6`
                    }, ${brandInfo ? brandInfo?.secondary_color : `#a855f7`})`,
                  }}
                >
                  {(
                    clientInformation?.name?.split(" ")[0] || ""
                  ).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-0 shadow-2xl rounded-2xl"
            align="end"
            forceMount
          >
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {clientInformation?.name}
                </p>
                <p className="w-[200px] truncate text-sm text-gray-600 dark:text-gray-400">
                  {clientInformation?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Member since Jan 2025
                </p>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            {/* <DropdownMenuItem asChild>
              <Link href="/monitor" className="cursor-pointer">
                <Activity className="mr-2 h-4 w-4" />
                Results
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />             */}

            <DropdownMenuItem
              onTouchEnd={() => setShowLogoutDialog(true)}
              onClick={() => setShowLogoutDialog(true)}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-red-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-red-900/20 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Are you sure you want to sign out?</DialogTitle>
            </DialogHeader>
            <DialogFooter className="flex items-center justify-center gap-2">
              <Button onClick={handleLogout} className="bg-red-500 text-white">
                Sign out
              </Button>
              <Button
                onClick={() => setShowLogoutDialog(false)}
                className="bg-gray-500 text-white"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
