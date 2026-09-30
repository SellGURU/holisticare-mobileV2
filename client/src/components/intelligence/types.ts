export type IntelligenceStatus =
  | "available"
  | "empty"
  | "pending"
  | "error";

export type IntelligenceScore = {
  key: string;
  label: string;
  description?: string | null;
  value: number | null;
  unit: "score";
  scale_min: number | null;
  scale_max: number | null;
  direction: "higher_is_better";
  severity?: string | null;
  calculated_at?: string | null;
  source_as_of?: string | null;
  calculation_version?: string | null;
  definition_version_id?: string | null;
};

export type IntelligenceAge = {
  key: string;
  label: string;
  description?: string | null;
  value: number | null;
  unit: "years";
  severity?: string | null;
  calculated_at?: string | null;
  source_as_of?: string | null;
  calculation_version?: string | null;
  definition_version_id?: string | null;
};

export type IntelligenceSummary = {
  contract_version: string;
  status: IntelligenceStatus;
  calculated_at: string | null;
  scores: IntelligenceScore[];
  ages: IntelligenceAge[];
};

export const EMPTY_INTELLIGENCE_SUMMARY: IntelligenceSummary = {
  contract_version: "1",
  status: "empty",
  calculated_at: null,
  scores: [],
  ages: [],
};
