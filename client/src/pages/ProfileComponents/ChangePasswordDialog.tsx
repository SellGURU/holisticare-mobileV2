import Application from "@/api/app";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-message";
import { UseMutationResult } from "@tanstack/react-query";
import { Eye, EyeOff, Info, Lock, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ShowPasswords {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showLater?: boolean;
  onDefer?: () => void;
  passwordData: PasswordData;
  setPasswordData: React.Dispatch<React.SetStateAction<PasswordData>>;
  showPasswords: ShowPasswords;
  setShowPasswords: React.Dispatch<React.SetStateAction<ShowPasswords>>;
  changePasswordMutation: UseMutationResult<any, any, PasswordData, unknown>;
}

interface ValidationErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const ChangePasswordDialog = ({
  open,
  onOpenChange,
  showLater = false,
  onDefer,
  passwordData,
  setPasswordData,
  showPasswords,
  setShowPasswords,
  changePasswordMutation,
}: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Validation functions
  const validateCurrentPassword = (value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "This field is required";
    }
    return undefined;
  };

  const validateNewPassword = (value: string): string | undefined => {
    if (!value || value.trim() === "") {
      return "This field is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[a-z]/.test(value)) {
      return "Password must contain lowercase letters";
    }
    if (!/[A-Z]/.test(value)) {
      return "Password must contain uppercase letters";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      return "Password must contain special characters";
    }
    return undefined;
  };

  const validateConfirmPassword = (
    value: string,
    newPassword: string
  ): string | undefined => {
    if (!value || value.trim() === "") {
      return "This field is required";
    }
    if (value !== newPassword) {
      return "Passwords do not match";
    }
    return undefined;
  };

  // Reset errors when dialog closes
  useEffect(() => {
    if (!open) {
      setErrors({});
    }
  }, [open]);

  const inputClass = (hasError?: string) =>
    `h-11 rounded-xl border-gray-200 bg-gray-50/80 pr-11 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-red-500/40 dark:border-gray-700 dark:bg-gray-800/60 ${
      hasError ? "border-red-500 dark:border-red-500" : ""
    }`;

  const toggleClass =
    "absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg p-0 text-gray-500 hover:bg-gray-200/70 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/70 dark:hover:text-gray-200";

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onDefer?.();
        }
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[92dvh] w-full max-w-md flex-col gap-0 rounded-t-3xl border-x-0 border-t border-gray-200/50 bg-white/95 p-0 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/95 [&>button]:hidden"
      >
        {/* Drag handle */}
        <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
          <span className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <SheetHeader className="flex-shrink-0 space-y-0 px-5 pb-3 pt-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500/15 to-pink-500/15">
                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Change Password
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Enter your current password and choose a new one
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                className="h-8 w-8 flex-shrink-0 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Form */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="currentPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }));
                }}
                onBlur={() => {
                  validateCurrentPassword(passwordData.currentPassword);
                }}
                className={inputClass(errors.currentPassword)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  showPasswords.current ? "Hide password" : "Show password"
                }
                className={toggleClass}
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label
                htmlFor="newPassword"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Password
              </Label>
              <Popover open={isInfoOpen} onOpenChange={setIsInfoOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full p-0.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Password requirements"
                    onMouseEnter={() => setIsInfoOpen(true)}
                    onMouseLeave={() => setIsInfoOpen(false)}
                  >
                    <Info className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 p-3 text-sm"
                  side="top"
                  sideOffset={8}
                  onMouseEnter={() => setIsInfoOpen(true)}
                  onMouseLeave={() => setIsInfoOpen(false)}
                >
                  <p className="text-gray-700 dark:text-gray-300">
                    At least 8 characters. (Use Uppercase & Lowercase letters,
                    Numbers and Special characters)
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }));
                }}
                className={inputClass(errors.newPassword)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  showPasswords.new ? "Hide password" : "Show password"
                }
                className={toggleClass}
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateConfirmPassword(
                    passwordData.confirmPassword,
                    passwordData.newPassword
                  );
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: error,
                  }));
                }}
                className={inputClass(errors.confirmPassword)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={
                  showPasswords.confirm ? "Hide password" : "Show password"
                }
                className={toggleClass}
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

          <div className="flex flex-shrink-0 flex-col gap-2 border-t border-gray-100 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-3 dark:border-gray-800">
            <Button
              onClick={() => {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: "Passwords do not match",
                  }));
                  return;
                }
                Application.varifyPassword({
                  current_password: passwordData.currentPassword,
                  new_password: passwordData.newPassword,
                })
                  .then((res) => {
                    if (res.status === 200) {
                      changePasswordMutation.mutate(passwordData);
                    } else {
                      toast({
                        title: "Invalid password",
                        description: "Please enter a valid password",
                      });
                    }
                  })
                  .catch((err) => {
                    const detail = err?.response?.data?.detail;
                    if (detail && typeof detail === "object") {
                      setErrors((prev) => ({
                        ...prev,
                        newPassword: detail.new_password,
                        currentPassword: detail.current_password,
                      }));
                      return;
                    }
                    toast({
                      title: "Could not verify password",
                      description: getErrorMessage(err),
                      variant: "destructive",
                    });
                  });
              }}
              disabled={changePasswordMutation.isPending}
              className="h-11 w-full rounded-xl bg-gradient-to-r from-red-600 to-pink-600 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending
                ? "Changing..."
                : "Change Password"}
            </Button>
            {showLater && (
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-xl text-gray-600 dark:text-gray-300"
                onClick={() => onDefer?.()}
              >
                Later
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChangePasswordDialog;
