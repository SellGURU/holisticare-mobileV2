import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { applicationData } from "@/lib/query/applicationQuery";
import { queryKeys } from "@/lib/query/keys";

export function useTodayTasksQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.todayTasks,
    queryFn: () => applicationData<any[]>(Application.getTodayTasks()),
    enabled,
  });
}
