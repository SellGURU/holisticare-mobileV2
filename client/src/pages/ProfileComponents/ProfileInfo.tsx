import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isUsableProfilePicture } from "@/lib/profilePicture";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Crown,
  FlaskConical,
  User,
} from "lucide-react";

interface ProfileInfoProps {
  clientInformation: any;
  brandInfo: any;
  getMembershipDuration: () => string;
  getSubscriptionBadge: (plan: string) => React.ReactNode;
}

const ProfileInfo = ({
  clientInformation,
  brandInfo,
  getMembershipDuration,
  getSubscriptionBadge,
}: ProfileInfoProps) => {
  const initials =
  (clientInformation?.name?.split(" ")[0] || "U").charAt(0).toUpperCase() +
  (clientInformation?.name?.split(" ")[1]?.charAt(0).toUpperCase() || "");

  const stats = [
    {
      label: "Lab Tests",
      value: clientInformation?.lab_test ?? "—",
      icon: FlaskConical,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Action Plans",
      value: clientInformation?.action_plan ?? "—",
      icon: ClipboardList,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Age",
      value: clientInformation?.age ?? "—",
      icon: User,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
  ];

  return (
    <Card className="overflow-hidden border border-gray-200/60 bg-white/90 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-900/90">
      <div className="h-20 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10" />
      <CardContent className="relative px-5 pb-5 pt-0">
        <div className="-mt-10 flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg dark:border-gray-900">
              {isUsableProfilePicture(clientInformation?.picture) && (
                <AvatarImage
                  src={clientInformation.picture}
                  alt={clientInformation?.name || "Profile"}
                  className="object-cover"
                />
              )}
              <AvatarFallback
                className="text-lg font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${
                    brandInfo?.primary_color ?? "#10b981"
                  }, ${brandInfo?.secondary_color ?? "#14b8a6"})`,
                }}
              >
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md ring-2 ring-white dark:ring-gray-900">
              <Crown className="h-3.5 w-3.5 text-white" />
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {clientInformation?.name || "User"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {clientInformation?.email}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {getSubscriptionBadge(clientInformation?.plan || "free")}
            {clientInformation?.verified_account ? (
              <Badge
                variant="outline"
                className="border-emerald-200/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-200/60 bg-amber-50/80 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300"
              >
                Unverified
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-blue-200/60 bg-blue-50/80 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300"
            >
              <Activity className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center rounded-2xl px-2 py-3 ${stat.bg}`}
            >
              <stat.icon className={`mb-1.5 h-4 w-4 ${stat.color}`} />
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stat.value}
              </span>
              <span className="text-center text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-gray-50/80 px-4 py-3 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <User className="h-3.5 w-3.5" />
              Gender
            </span>
            <span className="font-medium capitalize text-gray-900 dark:text-gray-100">
              {clientInformation?.sex || "Not specified"}
            </span>
          </div>
          <div className="h-px bg-gray-200/80 dark:bg-gray-700/80" />
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              Member for
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {getMembershipDuration()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;
