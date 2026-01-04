import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Brain,
  ClipboardList,
  Loader2,
  Mail,
  Smartphone,
} from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setNotificationSettings: Dispatch<
    SetStateAction<{
      emailNotifications: boolean;
      pushNotifications: boolean;
      chatMessages: boolean;
      questionnaire_assigned: boolean;
    }>
  >;
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    chatMessages: boolean;
    questionnaire_assigned: boolean;
  };
  isLoadingNotificationSettings: boolean;
  saveNotificationSettings: () => void;
}

const NotificationDialog = ({
  open,
  onOpenChange,
  notificationSettings,
  setNotificationSettings,
  isLoadingNotificationSettings,
  saveNotificationSettings,
}: NotificationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-gradient-to-br from-white/95 via-white/90 to-blue-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-blue-900/20 backdrop-blur-xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Manage how you receive notifications from HolistiCare
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Communication Methods
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-white/50 dark:from-blue-900/20 dark:to-gray-800/30">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Email Notifications
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Receive updates via email
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailNotifications: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-blue-50/50 to-white/50 dark:from-blue-900/20 dark:to-gray-800/30">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Push Notifications
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Get instant alerts on your device
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      pushNotifications: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Content Preferences
            </h3>
            <div className="space-y-3">
              {/* <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Lab Results
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  New test results and analysis
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.labResults}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  labResults: checked,
                }))
              }
            />
          </div> */}
              {/* <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Goal Reminders
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Daily and weekly goal check-ins
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.goalReminders}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  goalReminders: checked,
                }))
              }
            />
          </div> */}
              {/* <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Weekly Reports
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Summary of your health progress
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.weeklyReports}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  weeklyReports: checked,
                }))
              }
            />
          </div> */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50/50 to-white/50 dark:from-purple-900/20 dark:to-gray-800/30">
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Chat Messages
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      AI assistant and coach messages
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.chatMessages}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      chatMessages: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-900/20 dark:to-gray-800/30">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Questionnaire Assigned
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      New health assessments to complete
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.questionnaire_assigned}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      questionnaire_assigned: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Other
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  System Updates
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  App updates and maintenance
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.systemUpdates}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  systemUpdates: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30">
            <div className="flex items-center gap-3">
              <Award className="w-4 h-4 text-gray-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Marketing Emails
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Product updates and tips
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.marketingEmails}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({
                  ...prev,
                  marketingEmails: checked,
                }))
              }
            />
          </div>
        </div>
      </div> */}
        </div>
        <div className="flex flex-col gap-2 pt-3">
          <Button
            onClick={saveNotificationSettings}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
            disabled={isLoadingNotificationSettings}
          >
            {isLoadingNotificationSettings ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Preferences"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-600/50"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;
