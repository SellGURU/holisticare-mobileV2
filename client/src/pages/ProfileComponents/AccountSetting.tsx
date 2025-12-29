import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Settings } from "lucide-react";

interface AccountSettingProps {
  settingsItems: any[];
}

const AccountSetting = ({ settingsItems }: AccountSettingProps) => {
  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Account Settings */}
        <Card className="bg-gradient-to-br from-white/90 via-white/80 to-gray-50/60 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-900/20 border-0 shadow-xl backdrop-blur-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-gray-900 to-emerald-800 dark:from-white dark:to-emerald-200 bg-clip-text text-transparent flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <Settings className="w-3 h-3 text-white" />
              </div>
              Account Settings
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {settingsItems.slice(0, 5).map((item, index) => {
              const hasRightElement = Boolean(item.rightElement);

              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/30 hover:from-emerald-50/60 hover:to-teal-50/60 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 transition-all duration-300 hover:shadow-lg group min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 group-hover:from-emerald-500 group-hover:to-teal-500 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm">
                      <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-light">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-1">
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}

                    {hasRightElement ? (
                      <span
                        className="ml-2"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {item.rightElement}
                      </span>
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="my-4"></div>
      </div>
    </>
  );
};

export default AccountSetting;
