import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { applicationData } from "@/lib/query/applicationQuery";
import { queryKeys } from "@/lib/query/keys";

export type HolisticPlanActionPlan = {
  latest_deep_analysis: string;
  num_of_interventions: number;
  progress: number;
};

const EMPTY_PLAN: HolisticPlanActionPlan = {
  latest_deep_analysis: "",
  num_of_interventions: 0,
  progress: 0,
};

export function useHolisticPlanActionPlanQuery() {
  return useQuery({
    queryKey: queryKeys.holisticPlanActionPlan,
    queryFn: () =>
      applicationData<HolisticPlanActionPlan>(
        Application.getHolisticPlanActionPlan(),
      ),
  });
}

export { EMPTY_PLAN };
