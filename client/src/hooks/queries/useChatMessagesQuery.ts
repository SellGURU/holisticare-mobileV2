import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Application from "@/api/app";
import { queryKeys } from "@/lib/query/keys";
import { sortMessagesChronologically } from "@/lib/chatMessageOrder";
import {
  coachChatRefetchIntervalMs,
  isDocumentVisible,
} from "@/lib/coachChatPoll";

export type ChatMode = "ai" | "coach";

export type ChatPresenceParty = {
  name: string;
  online: boolean;
};

export type ChatMessagesData = {
  conversation_id: number;
  messages: any[];
  you?: ChatPresenceParty;
  peer?: ChatPresenceParty;
};

export function useChatMessagesQuery(mode: ChatMode) {
  const [visible, setVisible] = useState(() => isDocumentVisible());

  useEffect(() => {
    const onVisibility = () => setVisible(isDocumentVisible());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return useQuery({
    queryKey: queryKeys.chatMessages(mode),
    queryFn: async (): Promise<ChatMessagesData> => {
      const response = await Application.getMessagesId({ message_from: mode });
      return {
        conversation_id: response.data?.conversation_id ?? 1,
        messages: sortMessagesChronologically(response.data?.messages ?? []),
        you: response.data?.you,
        peer: response.data?.peer,
      };
    },
    refetchInterval:
      mode === "coach" ? coachChatRefetchIntervalMs(visible) : false,
    staleTime: mode === "coach" ? (visible ? 4_000 : 10_000) : 5 * 60_000,
  });
}
