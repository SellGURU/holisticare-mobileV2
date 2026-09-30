import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { resolveHtmlReportState, type HtmlReportState } from "@/lib/htmlReport";
import { queryKeys } from "@/lib/query/keys";

export function useHtmlReportQuery() {
  return useQuery({
    queryKey: queryKeys.htmlReport,
    queryFn: async (): Promise<HtmlReportState> => {
      const response = await Application.getHtmlReport();
      return resolveHtmlReportState(response.data);
    },
  });
}
