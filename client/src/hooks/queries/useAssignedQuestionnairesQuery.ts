import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { applicationData } from "@/lib/query/applicationQuery";
import { queryKeys } from "@/lib/query/keys";

export type AssignedQuestionnaire = {
  Estimated_time: string;
  status: string;
  title: string;
  unique_id: string;
  forms_unique_id: string;
};

export function useAssignedQuestionnairesQuery() {
  return useQuery({
    queryKey: queryKeys.assignedQuestionnaires,
    queryFn: () =>
      applicationData<AssignedQuestionnaire[]>(
        Application.getAssignedQuestionaries(),
      ),
  });
}
