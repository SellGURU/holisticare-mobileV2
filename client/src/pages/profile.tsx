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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { subscribe } from "@/lib/event";
import { secureStorage } from "@/services/secureStorage";
import { useMutation } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  Brain,
  ChevronRight,
  HelpCircle,
  Lock,
  Mail,
  Shield,
  Trash2,
  User,
  Watch,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AccountSetting from "./ProfileComponents/AccountSetting";
import ChangePasswordDialog from "./ProfileComponents/ChangePasswordDialog";
import DeleteAcountDialog from "./ProfileComponents/DeleteAcountDialog";
import NotificationDialog from "./ProfileComponents/NotificationDialog";
import ProfileInfo from "./ProfileComponents/ProfileInfo";

export default function Profile() {
  const { user, logout, fetchClientInformation } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [clientInformation, setClientInformation] = useState<{
    action_plan: number;
    age: number;
    active_client: boolean;
    plan?: string;
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
    // plan:string
    has_changed_password?: boolean;
    // plan: string;
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

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if password change is required
  let isPasswordChangeRequired =
    clientInformation?.has_changed_password === false;

  // Check if password change is required on mount
  // useEffect(() => {
  //   const requirePasswordChange = localStorage.getItem("requirePasswordChange");
  //   if (requirePasswordChange === "true") {
  //     setShowPasswordDialog(true);
  //     localStorage.removeItem("requirePasswordChange");
  //   }
  // }, []);
  useEffect(() => {
    const requirePasswordChange = localStorage.getItem("requirePasswordChange");
    if (requirePasswordChange === "true") {
      setShowPasswordDialog(true);
      localStorage.removeItem("requirePasswordChange");
    }
  }, []);

  // Prevent navigation away if password change is required
  useEffect(() => {
    if (isPasswordChangeRequired && location !== "/profile") {
      setLocation("/profile");
      if (!showPasswordDialog) {
        setShowPasswordDialog(true);
      }
      toast({
        title: "Password Change Required",
        description: "Please change your password before continuing.",
        variant: "destructive",
      });
    }
  }, [
    location,
    isPasswordChangeRequired,
    showPasswordDialog,
    setLocation,
    toast,
  ]);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    setEditData({
      firstName: clientInformation?.name?.split(" ")[0] || "",
      lastName: clientInformation?.name?.split(" ")[1] || "",
      dateOfBirth: clientInformation?.date_of_birth || "",
      gender: clientInformation?.sex || "",
    });
  }, [clientInformation]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    pushNotifications: false,
    chatMessages: false,
    questionnaire_assigned: false,
  });
  const [isLoadingNotificationSettings, setIsLoadingNotificationSettings] =
    useState(false);

  // Load notification settings when dialog opens
  const loadNotificationSettings = async () => {
    try {
      const res = await Application.showNotifications({});
      const data = res?.data || {};
      const channels = data.channels || {};
      const content = data.content_types || {};
      setNotificationSettings((prev) => ({
        ...prev,
        emailNotifications: Boolean(channels.email),
        pushNotifications: Boolean(channels.push),
        chatMessages: Boolean(content.chat_messages),
        questionnaire_assigned: Boolean(content.questionnaire_assigned),
      }));
    } catch (error: any) {
      toast({
        title: "Failed to load notification settings",
        description:
          error?.response?.data?.detail ||
          (error instanceof Error ? error.message : "Please try again."),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (showNotificationsDialog) {
      loadNotificationSettings();
    }
  }, [showNotificationsDialog]);

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithDoctors: true,
    anonymousAnalytics: true,
    shareHealthInsights: false,
    publicProfile: false,
    dataRetention: "2_years",
    thirdPartyIntegrations: true,
  });

  // Load privacy settings from API when dialog opens
  const loadPrivacySettings = async () => {
    try {
      const res = await Application.showPrivacy({});
      const data = res?.data || {};
      setPrivacySettings((prev) => ({
        ...prev,
        shareDataWithDoctors: Boolean(data.share_with_doctors),
        shareHealthInsights: Boolean(data.health_insights_sharing),
        anonymousAnalytics: Boolean(data.anonymous_analytics),
        dataRetention: data.data_retention_period || prev.dataRetention,
      }));
    } catch (error: any) {
      toast({
        title: "Failed to load privacy settings",
        description:
          error?.response?.data?.detail ||
          (error instanceof Error ? error.message : "Please try again."),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (showPrivacyDialog) {
      loadPrivacySettings();
    }
  }, [showPrivacyDialog]);

  // Device settings with ROOK integration
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);

  const [isUpdatingPersonalInfo, setIsUpdatingPersonalInfo] = useState(false);

  const handleUpdatePersonalInfo = async () => {
    setIsUpdatingPersonalInfo(true);
    Application.updatePersonalInfo({
      first_name: editData.firstName,
      last_name: editData.lastName,
      date_of_birth: editData.dateOfBirth,
      gender: editData.gender,
    })
      .then(() => {
        toast({
          title: "Profile updated",
          description:
            "Your profile information has been updated successfully.",
        });
        setShowEditDialog(false);
        // Refresh client information so changes reflect immediately
        handleGetClientInformation();
      })
      .catch((res) => {
        toast({
          title: "Error",
          description: res?.response?.data?.detail,
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsUpdatingPersonalInfo(false);
      });
  };
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await Application.deleteAccount(deleteConfirmation);
      return res;
    },
    onSuccess: () => {},
    onError: (error) => {},
  });
  const handleDeleteAccount = () => {
    const requiredText = `DELETE/${clientInformation?.name}`;
    if (deleteConfirmation === requiredText) {
      deleteAccountMutation.mutate();
      setShowDeleteAccountDialog(false);
      // setDeleteConfirmation("");
    }
  };
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      const payload = {
        current_password: data.currentPassword,
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      };
      const res = await Application.changePassword(payload);
      return res;
    },
    onSuccess: async (res: any) => {
      if (res?.status === 200) {
        const creds = await secureStorage.get();
        if (creds) {
          await secureStorage.save(creds.email, passwordData.newPassword);
        }
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        setShowPasswordDialog(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        // Refresh client information to update has_changed_password flag
        handleGetClientInformation();
        // Also refresh auth service client information
        fetchClientInformation();

        setLocation("/");
      } else {
        toast({
          title: "Password Change Failed",
          description: res?.data?.detail || "Unexpected server response.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.detail;
      toast({
        title: "Password change failed",
        description:
          serverMessage ||
          (error instanceof Error ? error.message : "Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a mock data export
      const exportData = {
        profile: user,
        labResults: "Lab results data...",
        actionPlans: "Action plans data...",
        healthInsights: "Health insights data...",
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `holisticare-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your health data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoadingNotificationSettings(true);
    const payload = {
      channels: {
        email: !!notificationSettings.emailNotifications,
        push: !!notificationSettings.pushNotifications,
      },
      content_types: {
        chat_messages: !!notificationSettings.chatMessages,
        questionnaire_assigned: !!notificationSettings.questionnaire_assigned,
      },
    };
    await Application.saveNotifications(payload)
      .then((res) => {
        if (res?.status === 200) {
          toast({
            title: "Notifications updated",
            description: "Your notification preferences have been saved.",
          });
        }
      })
      .catch((error) => {
        toast({
          title: "Failed to save notifications",
          description:
            error?.response?.data?.detail ||
            (error instanceof Error
              ? error.message
              : "Unexpected server response."),
          variant: "destructive",
        });
      })
      .finally(() => {
        setShowNotificationsDialog(false);
        setIsLoadingNotificationSettings(false);
      });
  };

  const savePrivacySettings = async () => {
    try {
      const payload = {
        share_with_doctors: privacySettings.shareDataWithDoctors,
        health_insights_sharing: privacySettings.shareHealthInsights,
        anonymous_analytics: privacySettings.anonymousAnalytics,
        data_retention_period: privacySettings.dataRetention,
      };
      const res = await Application.savePrivacy(payload);
      if (res?.status === 200) {
        toast({
          title: "Privacy settings updated",
          description: "Your privacy preferences have been saved.",
        });
        setShowPrivacyDialog(false);
      } else {
        toast({
          title: "Failed to save privacy settings",
          description: res?.data?.detail || "Unexpected server response.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to save privacy settings",
        description:
          error?.response?.data?.detail ||
          (error instanceof Error ? error.message : "Please try again."),
        variant: "destructive",
      });
    }
  };
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    // 1) read current app class
    const root = document.documentElement;
    const hasDarkClass = root.classList.contains("dark");
  
    setIsDarkMode(hasDarkClass);
  
    // 2) optional: only apply if you want this component to own the class
    // applyTheme(hasDarkClass);
  }, []);
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
  const settingsItems = [
    // {
    //   icon: User,
    //   title: "Personal Information",
    //   description: "Update your profile details",
    //   action: () => setShowEditDialog(true),
    //   badge: null,
    // },
    {
      icon: Watch,
      title: "Wearable Devices",
      description: "Connect and manage your health devices",
      action: () => setLocation("/devices"),
      badge:
        connectedDevices.length > 0 ? connectedDevices.length.toString() : null,
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your notification preferences",
      action: () => setShowNotificationsDialog(true),
      badge: null,
    },
    // {
    //   icon: Shield,
    //   title: "Privacy & Data",
    //   description: "Control your data sharing preferences",
    //   action: () => setShowPrivacyDialog(true),
    //   badge: null,
    // },
    // {
    //   icon: Download,
    //   title: "Export Data",
    //   description: "Download your health data",
    //   action: () => handleExportData(),
    //   badge: null,
    // },
    // {
    //   icon: HelpCircle,
    //   title: "Help & Support",
    //   description: "Get help and contact support",
    //   action: () => setShowHelpDialog(true),
    //   badge: null,
    // },
    {
      icon: Lock,
      title: "Change Password",
      description: "Update your account password",
      action: () => setShowPasswordDialog(true),
      badge: null,
    },
    {
      icon: Trash2,
      title: "Delete Account",
      description: "Permanently delete your account and data",
      action: () => setShowDeleteAccountDialog(true),
      badge: null,
    },
    {
      icon: Settings,
      title: "Appearance",
      description: "Toggle dark mode",
      action: toggleDarkMode,
      badge: null,
      rightElement: (
        <Switch
          checked={isDarkMode}
          onCheckedChange={toggleDarkMode}
          onClick={(e) => e.stopPropagation()} // prevents triggering row action twice
        />
      ),
    },
  ];

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case "plus":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200/50 dark:text-emerald-300 dark:border-emerald-800/30 backdrop-blur-sm">
            Plus Plan
          </Badge>
        );

      case "professional":
        return (
          <Badge className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 border-purple-200/50 dark:text-purple-300 dark:border-purple-800/30 backdrop-blur-sm">
            Professional
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-gray-500/10 capitalize to-slate-500/10 backdrop-blur-sm"
          >
            {tier} Plan
          </Badge>
        );
    }
  };

  const getMembershipDuration = () => {
    // Calculate membership duration
    const joinDate = new Date(clientInformation?.member_since || ""); // Example join date
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return `${diffMonths} months`;
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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 dark:from-gray-900 dark:via-emerald-900/20 dark:to-teal-900/10">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20 dark:border-gray-700/30 shadow-2xl">
        <div className="max-w-4xl mx-auto px-3 py-4">
          <div>
            <h1 className="text-xl font-medium bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 py-4 space-y-4">
        {/* Profile Overview Card */}
        <ProfileInfo
          clientInformation={clientInformation}
          brandInfo={brandInfo}
          getMembershipDuration={getMembershipDuration}
          getSubscriptionBadge={getSubscriptionBadge}
        />

        {/* Settings Sections */}
        <AccountSetting settingsItems={settingsItems} />

        {/* Edit Profile Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-emerald-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-emerald-900/20 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent">
                Edit Profile
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label
                    htmlFor="edit-firstname"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    First Name
                  </Label>
                  <Input
                    id="edit-firstname"
                    value={editData.firstName || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-gray-700/80 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm shadow-inner"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-lastname"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="edit-lastname"
                    value={editData.lastName || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-gray-700/80 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label
                    htmlFor="edit-birthdate"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Date of Birth
                  </Label>
                  <Input
                    id="edit-birthdate"
                    type="date"
                    value={editData.dateOfBirth || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    className="bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-gray-700/80 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm shadow-inner"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-gender"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  >
                    Gender
                  </Label>
                  <Select
                    value={editData.gender}
                    onValueChange={(value) =>
                      setEditData((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger className="bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-gray-700/80 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm shadow-inner">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      {/* <SelectItem value="other">Other</SelectItem> */}
                      {/* <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3">
                <Button
                  onClick={handleUpdatePersonalInfo}
                  disabled={isUpdatingPersonalInfo}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                >
                  {isUpdatingPersonalInfo ? "Updating..." : "Update Profile"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          isPasswordChangeRequired={isPasswordChangeRequired}
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          showPasswords={showPasswords}
          setShowPasswords={setShowPasswords}
          changePasswordMutation={changePasswordMutation}
        />

        {/* Notifications Dialog */}
        <NotificationDialog
          open={showNotificationsDialog}
          onOpenChange={setShowNotificationsDialog}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
          isLoadingNotificationSettings={isLoadingNotificationSettings}
          saveNotificationSettings={saveNotificationSettings}
        />

        {/* Privacy & Data Dialog */}
        <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
          <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-purple-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-purple-900/20 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-purple-800 dark:from-white dark:to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Privacy & Data Control
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Control how your health data is used and shared
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Data Sharing
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Share with Doctors
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Allow healthcare providers to access your data
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.shareDataWithDoctors}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          shareDataWithDoctors: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-50/50 to-white/50 dark:from-blue-900/20 dark:to-gray-800/30">
                    <div className="flex items-center gap-3">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Health Insights Sharing
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Share anonymized insights for research
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.shareHealthInsights}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          shareHealthInsights: checked,
                        }))
                      }
                    />
                  </div>
                  {/* <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50/50 to-white/50 dark:from-purple-900/20 dark:to-gray-800/30">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Public Profile
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Make your health journey visible to others
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.publicProfile}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          publicProfile: checked,
                        }))
                      }
                    />
                  </div> */}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Analytics & Tracking
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Anonymous Analytics
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Help improve HolistiCare with usage data
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.anonymousAnalytics}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          anonymousAnalytics: checked,
                        }))
                      }
                    />
                  </div>
                  {/* <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30">
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Third-party Integrations
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Allow connections to fitness apps and devices
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={privacySettings.thirdPartyIntegrations}
                      onCheckedChange={(checked) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          thirdPartyIntegrations: checked,
                        }))
                      }
                    />
                  </div> */}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Data Retention
                </h3>
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50/50 to-white/50 dark:from-orange-900/20 dark:to-gray-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Lock className="w-4 h-4 text-orange-600" />
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Data Retention Period
                    </div>
                  </div>
                  <Select
                    value={privacySettings.dataRetention}
                    onValueChange={(value) =>
                      setPrivacySettings((prev) => ({
                        ...prev,
                        dataRetention: value,
                      }))
                    }
                  >
                    <SelectTrigger className="bg-gradient-to-r from-white/80 to-orange-50/50 dark:from-gray-700/80 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/30 backdrop-blur-sm shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_year">1 Year</SelectItem>
                      <SelectItem value="2_years">2 Years</SelectItem>
                      <SelectItem value="5_years">5 Years</SelectItem>
                      <SelectItem value="forever">Keep Forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    How long to keep your health data after account deletion
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-3">
              <Button
                onClick={savePrivacySettings}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
              >
                Save Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPrivacyDialog(false)}
                className="w-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Help & Support Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-orange-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-orange-900/20 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-orange-800 dark:from-white dark:to-orange-200 bg-clip-text text-transparent flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                Help & Support
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                Get help with using HolistiCare and contact our support team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[55vh] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Quick Help
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50/60 to-white/50 dark:from-blue-900/20 dark:to-gray-800/30 hover:from-blue-100/60 hover:to-blue-50/50 dark:hover:from-blue-900/30 dark:hover:to-blue-900/20 transition-all duration-300 group">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        User Guide
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Learn how to use all features
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-300 ml-auto" />
                  </button>

                  <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50/60 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30 hover:from-emerald-100/60 hover:to-emerald-50/50 dark:hover:from-emerald-900/30 dark:hover:to-emerald-900/20 transition-all duration-300 group">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Health Data FAQ
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Common questions about lab results
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors duration-300 ml-auto" />
                  </button>

                  <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50/60 to-white/50 dark:from-purple-900/20 dark:to-gray-800/30 hover:from-purple-100/60 hover:to-purple-50/50 dark:hover:from-purple-900/30 dark:hover:to-purple-900/20 transition-all duration-300 group">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Privacy Policy
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        How we protect your data
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors duration-300 ml-auto" />
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Contact Support
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-orange-50/60 to-white/50 dark:from-orange-900/20 dark:to-gray-800/30 hover:from-orange-100/60 hover:to-orange-50/50 dark:hover:from-orange-900/30 dark:hover:to-orange-900/20 transition-all duration-300 group">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Email Support
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        support@holisticare.com
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors duration-300 ml-auto" />
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  App Information
                </h3>
                <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50/60 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Version
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        2.1.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Last Updated
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        Jan 28, 2025
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Platform
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        Web App
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-3">
              <Button
                onClick={() => {
                  toast({
                    title: "Support contacted",
                    description: "We'll get back to you within 24 hours.",
                  });
                  setShowHelpDialog(false);
                }}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg"
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHelpDialog(false)}
                className="w-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteAcountDialog
          open={showDeleteAccountDialog}
          onOpenChange={setShowDeleteAccountDialog}
          deleteConfirmation={deleteConfirmation}
          setDeleteConfirmation={setDeleteConfirmation}
          deleteAccountMutation={deleteAccountMutation}
          clientInformation={clientInformation}
          handleDeleteAccount={handleDeleteAccount}
        />
      </div>
    </div>
  );
}
