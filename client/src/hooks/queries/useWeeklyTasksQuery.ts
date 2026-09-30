import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { applicationData } from "@/lib/query/applicationQuery";
import { queryKeys } from "@/lib/query/keys";

export function useWeeklyTasksQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.weeklyTasks,
    queryFn: () => applicationData<any[]>(Application.getWeeklyTasks()),
    enabled,
  });
}
