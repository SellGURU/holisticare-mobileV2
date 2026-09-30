export const queryKeys = {
  clientInformation: ["client-information"] as const,
  biomarkers: ["biomarkers"] as const,
  educationalContent: ["educational-content"] as const,
  todayTasks: ["today-tasks"] as const,
  weeklyTasks: ["weekly-tasks"] as const,
  holisticPlanActionPlan: ["holistic-plan-action-plan"] as const,
  assignedQuestionnaires: ["assigned-questionnaires"] as const,
  htmlReport: ["html-report"] as const,
  chatMessages: (mode: "ai" | "coach") => ["chat-messages", mode] as const,
  intelligenceSummary: ["intelligence-summary"] as const,
};

export const CLIENT_INFORMATION_STORAGE_KEY = "client_information";
