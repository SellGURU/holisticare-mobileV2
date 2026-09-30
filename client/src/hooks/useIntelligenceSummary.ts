import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import type { IntelligenceSummary } from "@/components/intelligence/types";
import { queryKeys } from "@/lib/query/keys";

export const INTELLIGENCE_SUMMARY_QUERY_KEY = queryKeys.intelligenceSummary;

function isIntelligenceSummary(value: unknown): value is IntelligenceSummary {
  if (!value || typeof value !== "object") return false;
  const data = value as IntelligenceSummary;
  return (
    typeof data.contract_version === "string" &&
    typeof data.status === "string" &&
    Array.isArray(data.scores) &&
    Array.isArray(data.ages)
  );
}

export function useIntelligenceSummary() {
  return useQuery({
    queryKey: INTELLIGENCE_SUMMARY_QUERY_KEY,
    queryFn: async (): Promise<IntelligenceSummary> => {
      const response = await Application.getIntelligenceSummary();
      const payload = response?.data;
      if (!isIntelligenceSummary(payload)) {
        throw new Error("Invalid Intelligence summary");
      }
      return payload;
    },
    retry: 1,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}
