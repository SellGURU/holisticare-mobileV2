import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, isPasswordChangeDeferred } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  User,
  LogOut,
  Check,
  X,
  Activity,
  Target,
  Brain,
  Calendar,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  FileText,
} from "lucide-react";
import Auth from "@/api/auth";
import Application from "@/api/app";
import { toast } from "@/hooks/use-toast";
import NotificationApi from "@/api/notification";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "../ui/sheet";
import { publish, subscribe, unsubscribe } from "@/lib/event";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
// import logoImage from "@assets/Logo5 2_1753791920091_1757240780580.png";

type BrandInfo = {
  last_update: string;
  logo: string;
  name: string;
  headline: string;
  primary_color: string;
  secondary_color: string;
  tone: string;
  focus_area: string;
};

type ClientInformation = {
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
};

const OPEN_HEALTH_REPORT_ACTION = "open_health_report";

// The backend sends `action` now; type/title keep older notifications tappable.
const resolveNotificationAction = (notification: any): string | null => {
  if (notification?.action) return String(notification.action);
  const type = String(notification?.notification_type ?? "")
    .trim()
    .toLowerCase();
  if (type === "report_ready" || type === "html_report_ready") {
    return OPEN_HEALTH_REPORT_ACTION;
  }
  const title = String(notification?.title ?? "")
    .trim()
    .toLowerCase();
  return title === "health report ready" ? OPEN_HEALTH_REPORT_ACTION : null;
};

const readStored = <T,>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
};

export default function ProfileHeader() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const [location, navigate] = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isUnReadNotif, setIsUnReadNotif] = useState(false);
  const [hadNotifications, setHadNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const seenReportNotificationsRef = useRef<Set<string>>(new Set());
  const notificationsLoadedRef = useRef(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [clientInformation, setClientInformation] = useState<
    ClientInformation | undefined
  >(() => readStored<ClientInformation>("client_information"));

  const handleGetClientInformation = async () => {
    Application.getClientInformation()
      .then((res) => {
        setClientInformation(res.data);
        try {
          localStorage.setItem("client_information", JSON.stringify(res.data));
        } catch {
          // ignore storage write failures (private mode, quota, etc.)
        }
        // Check if password change is required
        if (res.data?.has_changed_password === false && !isPasswordChangeDeferred()) {
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
      .catch((err) => {
        // Keep any cached value; don't blank the header on transient errors
        // (e.g. network not ready right after resuming from background).
        console.error("Failed to fetch client information", err);
      });
  };

  const handleGetBrandInfo = async () => {
    Application.getBrandInfo()
      .then((res) => {
        const info: BrandInfo | undefined = res?.data?.brand_elements;
        if (info) {
          setBrandInfo(info);
          try {
            localStorage.setItem("brand_info", JSON.stringify(info));
          } catch {
            // ignore storage write failures
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch brand info", err);
      });
  };

  useEffect(() => {
    handleGetClientInformation();
  }, []);

  // Refetch user + brand info whenever the app returns to the foreground.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => void } | undefined;
    let cancelled = false;

    CapacitorApp.addListener("appStateChange", (state) => {
      if (state.isActive) {
        handleGetClientInformation();
        handleGetBrandInfo();
      }
    }).then((handle) => {
      if (cancelled) {
        handle.remove();
      } else {
        listener = handle;
      }
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
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
      const notifData = res.data.map((n: any) => {
        const action = resolveNotificationAction(n);
        return {
          ...n,
          action,
          read_status: n.read_status || false,
          icon:
            action === OPEN_HEALTH_REPORT_ACTION
              ? FileText
              : n.type === "lab_result"
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
          color:
            n.color || (action === OPEN_HEALTH_REPORT_ACTION ? "purple" : "blue"),
        };
      });
      setNotifications(notifData);
      if (notifData.length > 0) {
        setHadNotifications(true);
      }

      // A report that just landed should show up without a manual refresh.
      const unseenReport = notifData.some(
        (n: any) =>
          n.action === OPEN_HEALTH_REPORT_ACTION &&
          !seenReportNotificationsRef.current.has(String(n.id))
      );
      notifData.forEach((n: any) => {
        if (n.action === OPEN_HEALTH_REPORT_ACTION) {
          seenReportNotificationsRef.current.add(String(n.id));
        }
      });
      if (unseenReport && notificationsLoadedRef.current) {
        publish("healthReportUpdated", {});
      }
      notificationsLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const openNotification = (notification: any) => {
    if (!notification.read_status) {
      markAsRead(notification.id);
    }
    if (notification.action !== OPEN_HEALTH_REPORT_ACTION) return;
    setShowNotifications(false);
    if (location === "/") {
      publish("openHealthReport", {});
    } else {
      navigate("/?openReport=1");
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

  // Static class map so Tailwind doesn't purge dynamically built color classes.
  const getNotifColor = (color: string) => {
    const map: Record<string, { chip: string; icon: string; bar: string }> = {
      emerald: {
        chip: "bg-emerald-100 dark:bg-emerald-900/40",
        icon: "text-emerald-600 dark:text-emerald-400",
        bar: "bg-emerald-500",
      },
      blue: {
        chip: "bg-blue-100 dark:bg-blue-900/40",
        icon: "text-blue-600 dark:text-blue-400",
        bar: "bg-blue-500",
      },
      purple: {
        chip: "bg-purple-100 dark:bg-purple-900/40",
        icon: "text-purple-600 dark:text-purple-400",
        bar: "bg-purple-500",
      },
      orange: {
        chip: "bg-orange-100 dark:bg-orange-900/40",
        icon: "text-orange-600 dark:text-orange-400",
        bar: "bg-orange-500",
      },
      green: {
        chip: "bg-green-100 dark:bg-green-900/40",
        icon: "text-green-600 dark:text-green-400",
        bar: "bg-green-500",
      },
    };
    return (
      map[color] ?? {
        chip: "bg-gray-100 dark:bg-gray-700/50",
        icon: "text-gray-600 dark:text-gray-400",
        bar: "bg-gray-400",
      }
    );
  };
  const [brandInfo, setBrandInfo] = useState<BrandInfo | undefined>(() =>
    readStored<BrandInfo>("brand_info")
  );

  useEffect(() => {
    const handler = (data: any) => {
      const info = data?.detail?.information;
      if (!info) return;
      setBrandInfo(info);
      try {
        localStorage.setItem("brand_info", JSON.stringify(info));
      } catch {
        // ignore storage write failures
      }
    };
    subscribe("brand_info", handler);
    return () => unsubscribe("brand_info", handler);
  }, []);

  const avatarGradient = `linear-gradient(135deg, ${
    brandInfo?.primary_color ?? "#10b981"
  }, ${brandInfo?.secondary_color ?? "#14b8a6"})`;

  const userInitials =
    (clientInformation?.name?.split(" ")[0]?.charAt(0) || "U").toUpperCase() +
    (clientInformation?.name?.split(" ")[1]?.charAt(0).toUpperCase() || "");

  const formatMemberSince = (date?: string) => {
    if (!date) return "Member";
    try {
      return `Member since ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(new Date(date))}`;
    } catch {
      return "Member";
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 pt-[calc(env(safe-area-inset-top)+0.5rem)] backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/90">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-gray-100 dark:ring-gray-800">
            <img
              src={brandInfo ? brandInfo.logo : "./logo.png"}
              alt="HolistiCare Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {brandInfo?.name || "HolistiCare"}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative h-9 w-9 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Bell className="h-[18px] w-[18px]" />
            {(notificationCount > 0 || isUnReadNotif) && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white dark:ring-gray-950">
                {notificationCount > 9 ? "9+" : notificationCount || 1}
              </span>
            )}
          </Button>
        </div>

        {/* Notifications Sheet */}
        <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
          <SheetContent
            side="bottom"
            className="mx-auto w-full max-w-md sm:max-w-lg flex max-h-[85dvh] flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
          >
            {/* Drag handle */}
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <SheetHeader className="flex-shrink-0 space-y-0 px-5 pb-3 pt-1 text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-purple-500/15">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Notifications
                    </SheetTitle>
                    <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {notificationCount > 0
                        ? `${notificationCount} unread notification${
                            notificationCount !== 1 ? "s" : ""
                          }`
                        : "You're all caught up"}
                    </SheetDescription>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {isUnReadNotif && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-8 rounded-full px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      Mark all read
                    </Button>
                  )}
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close notifications"
                      className="h-8 w-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetHeader>

            {/* List */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="relative mb-4">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                      <Bell className="h-9 w-9 text-blue-500/70 dark:text-blue-400/70" />
                    </span>
                    <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg ring-4 ring-white dark:ring-gray-900">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    No notifications
                  </h4>
                  <p className="mt-1 max-w-[16rem] text-sm text-gray-500 dark:text-gray-400">
                    {hadNotifications
                      ? "You're all caught up! New updates will show up here."
                      : "We'll let you know when something needs your attention."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {notifications.map((notification, index) => {
                    const IconComponent = notification.icon;
                    const colors = getNotifColor(notification.color);
                    const unread = !notification.read_status;
                    return (
                      <div
                        key={notification.id}
                        onClick={() => openNotification(notification)}
                        style={{
                          animationDelay: `${Math.min(index * 40, 240)}ms`,
                          animationFillMode: "backwards",
                        }}
                        className={`group relative flex animate-in cursor-pointer items-start gap-3 rounded-2xl p-3 transition-colors duration-200 fade-in slide-in-from-bottom-1 ${
                          unread
                            ? "bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
                            : "bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        {unread && (
                          <span
                            className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full ${colors.bar}`}
                          />
                        )}
                        <span
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            unread
                              ? colors.chip
                              : "bg-gray-200/70 dark:bg-gray-700/50"
                          }`}
                        >
                          <IconComponent
                            className={`h-5 w-5 ${
                              unread
                                ? colors.icon
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                        </span>

                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`break-words text-sm font-semibold ${
                                unread
                                  ? "text-gray-900 dark:text-gray-100"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            {unread && (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p
                            className={`mt-0.5 break-words text-xs leading-relaxed ${
                              unread
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {notification.action ===
                              OPEN_HEALTH_REPORT_ACTION && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNotification(notification);
                                }}
                                className="h-7 rounded-full px-2.5 text-xs text-purple-600 hover:bg-purple-100/70 dark:text-purple-400 dark:hover:bg-purple-900/30"
                              >
                                View report
                                <ChevronRight className="ml-1 h-3 w-3" />
                              </Button>
                            )}
                            {unread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-7 rounded-full px-2.5 text-xs text-blue-600 hover:bg-blue-100/70 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-7 rounded-full px-2.5 text-xs text-gray-500 hover:bg-red-100/70 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            >
                              <X className="mr-1 h-3 w-3" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Profile menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowProfileMenu(true)}
          aria-label="Open profile menu"
          className="h-9 w-9 rounded-full p-0 hover:bg-transparent"
        >
          <Avatar className="h-9 w-9 ring-2 ring-gray-200 dark:ring-gray-700">
            <AvatarFallback
              className="text-[11px] font-semibold text-white"
              style={{ background: avatarGradient }}
            >
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>

        <Sheet open={showProfileMenu} onOpenChange={setShowProfileMenu}>
          <SheetContent
            side="bottom"
            className="mx-auto flex max-h-[70dvh] w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
          >
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            <div className="flex flex-col items-center px-5 pb-4 pt-1 text-center">
              <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-gray-900">
                <AvatarFallback
                  className="text-lg font-semibold text-white"
                  style={{ background: avatarGradient }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-100">
                {clientInformation?.name || "User"}
              </h3>
              <p className="mt-0.5 max-w-[240px] truncate text-sm text-gray-500 dark:text-gray-400">
                {clientInformation?.email}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {formatMemberSince(clientInformation?.member_since)}
              </p>
            </div>

            <div className="space-y-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="group flex min-h-[52px] w-full items-center justify-between rounded-2xl bg-gray-50/80 px-3.5 py-3 transition-all active:scale-[0.99] hover:bg-gray-100/80 dark:bg-gray-800/50 dark:hover:bg-gray-800/70"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                    <User className="h-4 w-4 text-white" />
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Profile & Settings
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Manage your account
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowLogoutDialog(true);
                }}
                className="group flex min-h-[52px] w-full items-center justify-between rounded-2xl bg-red-50/60 px-3.5 py-3 transition-all active:scale-[0.99] hover:bg-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-950/35"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-sm">
                    <LogOut className="h-4 w-4 text-white" />
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-medium text-red-700 dark:text-red-400">
                      Sign out
                    </div>
                    <div className="text-xs text-red-600/70 dark:text-red-400/70">
                      Log out of your account
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-red-400 transition-colors group-hover:text-red-600" />
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <SheetContent
            side="bottom"
            className="mx-auto w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
          >
            <div className="flex justify-center pb-1 pt-3">
              <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <SheetHeader className="space-y-0 px-5 pb-2 pt-1 text-left">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/15">
                  <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                </span>
                <div>
                  <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Sign out?
                  </SheetTitle>
                  <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                    You will need to sign in again to access your account.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="flex gap-2 px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                className="h-11 flex-1 rounded-xl border-gray-200 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 font-medium text-white hover:from-red-700 hover:to-rose-700"
              >
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      </div>
    </header>
  );
}
