import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Loader2 } from "lucide-react";

type EmptyKind = "empty" | "pending" | "error" | "loading";

const COPY: Record<EmptyKind, { title: string; body: string }> = {
  loading: {
    title: "Loading your scores",
    body: "Checking your latest scores and age.",
  },
  pending: {
    title: "Updating your scores",
    body: "Your clinic is still calculating your scores and age.",
  },
  empty: {
    title: "No scores or age yet",
    body: "These appear here once your clinic has enough results to calculate them.",
  },
  error: {
    title: "Couldn't load your scores",
    body: "Please try again. Your other health information is still available.",
  },
};

export default function IntelligenceEmptyState({
  kind,
  onRetry,
}: {
  kind: EmptyKind;
  onRetry?: () => void;
}) {
  const copy = COPY[kind];

  return (
    <Card className="border border-gray-200/60 bg-white/90 shadow-sm dark:border-gray-700/50 dark:bg-gray-900/90">
      <CardContent className="flex flex-col items-center px-4 py-6 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40">
          {kind === "loading" || kind === "pending" ? (
            <Loader2 className="h-7 w-7 animate-spin text-teal-600 dark:text-teal-400" />
          ) : (
            <Activity className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          )}
        </span>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {copy.title}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {copy.body}
        </p>
        {kind === "error" && onRetry ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 h-10 rounded-xl"
            onClick={onRetry}
          >
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
