import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { resolveCalendarAge } from "@/components/intelligence/intelligenceDisplay";
import { applicationData } from "@/lib/query/applicationQuery";
import {
  CLIENT_INFORMATION_STORAGE_KEY,
  queryKeys,
} from "@/lib/query/keys";

export type ClientInformation = {
  show_phenoage?: boolean;
  action_plan: number;
  age: number;
  active_client?: boolean;
  plan?: string;
  coach_username: [];
  connected_wearable: boolean;
  date_of_birth: string;
  email: string;
  id: string;
  lab_test: number;
  member_since: string;
  name: string;
  pheno_age: number;
  sex: string;
  verified_account: boolean;
  has_changed_password?: boolean;
};

export function readStoredClientInformation(): ClientInformation | undefined {
  try {
    const raw = localStorage.getItem(CLIENT_INFORMATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClientInformation) : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredClientInformation(data: ClientInformation) {
  try {
    localStorage.setItem(CLIENT_INFORMATION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage write failures (private mode, quota, etc.)
  }
}

export function normalizeClientInformation(
  data: ClientInformation,
): ClientInformation {
  const age = resolveCalendarAge(data.age, data.date_of_birth);
  return { ...data, age: age ?? data.age };
}

export function useClientInformationQuery() {
  return useQuery({
    queryKey: queryKeys.clientInformation,
    queryFn: async () => {
      const data = await applicationData<ClientInformation>(
        Application.getClientInformation(),
      );
      const normalized = normalizeClientInformation(data);
      writeStoredClientInformation(normalized);
      return normalized;
    },
    initialData: () => {
      const stored = readStoredClientInformation();
      return stored ? normalizeClientInformation(stored) : undefined;
    },
    initialDataUpdatedAt: 0,
  });
}
