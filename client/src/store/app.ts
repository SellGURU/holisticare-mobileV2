import { createContext } from "react";

export type ChatMode = "ai" | "coach";

export const DEFAULT_CHAT_MODE: ChatMode = "ai";

export const AppContext = createContext({
  brandInfo: {
    last_update: "",
    logo: "",
    name: "",
    headline: "",
    primary_color: "",
    secondary_color: "",
    tone: "",
    focus_area: "",
  },
  wellnessScore: {
    scores: [] as any[],
    latest_date: null as string | null,
  },
  chatMode: DEFAULT_CHAT_MODE as ChatMode,
  setChatMode: (_mode: ChatMode) => {},
});
