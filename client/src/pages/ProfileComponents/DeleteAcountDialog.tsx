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
import { UseMutationResult } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface DeleteAcountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteConfirmation: string;
  setDeleteConfirmation: (deleteConfirmation: string) => void;
  deleteAccountMutation: UseMutationResult<any, any, any, unknown>;
  clientInformation?: {
    name: string;
  };
  handleDeleteAccount: () => void;
}

const DeleteAcountDialog = ({
  open,
  onOpenChange,
  deleteConfirmation,
  setDeleteConfirmation,
  deleteAccountMutation,
  clientInformation,
  handleDeleteAccount,
}: DeleteAcountDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setDeleteConfirmation("");
        }
      }}
    >
      <DialogContent className="max-w-lg bg-gradient-to-br from-white/95 via-white/90 to-red-50/60 dark:from-gray-800/95 dark:via-gray-800/90 dark:to-red-900/20 backdrop-blur-xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-thin bg-gradient-to-r from-gray-900 to-red-800 dark:from-white dark:to-red-200 bg-clip-text text-transparent flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 font-light">
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-medium mb-2">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Your profile and account information</li>
                  <li>All your health data and lab results</li>
                  <li>Your goals, challenges, and action plans</li>
                  <li>All questionnaire responses and insights</li>
                  <li>Your chat history and messages</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Label
              htmlFor="delete-confirmation"
              className="text-gray-700 dark:text-gray-300 font-medium"
            >
              Type{" "}
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-sm">
                DELETE/{clientInformation?.name}
              </span>{" "}
              to confirm
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder={`DELETE/${clientInformation?.name}`}
              className="mt-2 bg-white/80 dark:bg-gray-700/80 border-red-200/50 dark:border-red-800/30 focus:border-red-500 dark:focus:border-red-500"
              data-testid="input-delete-confirmation"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/30 p-3 rounded-lg">
            Once you delete your account, there is no going back. Please be
            certain.
          </div>

          <div className="pt-4">
            <Button
              onClick={handleDeleteAccount}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
              disabled={
                deleteConfirmation !== `DELETE/${clientInformation?.name}` ||
                deleteAccountMutation.isPending
              }
              data-testid="button-delete-account"
            >
              {deleteAccountMutation.isPending
                ? "Deleting Account..."
                : "Delete My Account Permanently"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAcountDialog;
