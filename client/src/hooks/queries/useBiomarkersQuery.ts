import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { queryKeys } from "@/lib/query/keys";

export function useBiomarkersQuery() {
  return useQuery({
    queryKey: queryKeys.biomarkers,
    queryFn: async () => {
      const response = await Application.getBiomarkersData();
      return (response.data?.biomarkers ?? []) as any[];
    },
  });
}
