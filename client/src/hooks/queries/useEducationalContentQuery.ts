import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import {
  DEFAULT_EDUCATIONAL_CONTENT,
  normalizeEducationalItems,
  type EducationalItem,
} from "@/data/default-educational-content";
import { queryKeys } from "@/lib/query/keys";

export function useEducationalContentQuery() {
  return useQuery({
    queryKey: queryKeys.educationalContent,
    queryFn: async (): Promise<EducationalItem[]> => {
      try {
        const response = await Application.getEducationalContent();
        const fromClinic = normalizeEducationalItems(response.data);
        return fromClinic.length > 0 ? fromClinic : DEFAULT_EDUCATIONAL_CONTENT;
      } catch {
        return DEFAULT_EDUCATIONAL_CONTENT;
      }
    },
  });
}
